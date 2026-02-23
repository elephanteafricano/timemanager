const net = require('net');
const logger = require('./logger');

const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = Number(process.env.SMTP_PORT || 1025);
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@timemanager.local';

const SMTP_TIMEOUT_MS = 7000;

const waitForResponse = (socket) => new Promise((resolve, reject) => {
  let buffer = '';

  const cleanup = () => {
    socket.off('data', onData);
    socket.off('error', onError);
    socket.off('timeout', onTimeout);
  };

  const onError = (error) => {
    cleanup();
    reject(error);
  };

  const onTimeout = () => {
    cleanup();
    reject(new Error('SMTP server timeout'));
  };

  const onData = (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split('\r\n');
    if (lines.length < 2) {
      return;
    }

    const completed = lines.slice(0, -1);
    const lastLine = completed[completed.length - 1];

    if (/^\d{3}\s/.test(lastLine)) {
      cleanup();
      const code = Number(lastLine.slice(0, 3));
      resolve({
        code,
        message: completed.join('\n'),
      });
    }
  };

  socket.on('data', onData);
  socket.on('error', onError);
  socket.on('timeout', onTimeout);
});

const sendCommand = async (socket, command, expectedCodes) => {
  if (command) {
    socket.write(`${command}\r\n`);
  }

  const response = await waitForResponse(socket);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${command || 'connect'}): ${response.message}`);
  }
  return response;
};

const sendPasswordResetEmail = async ({ to, resetLink }) => {
  const socket = net.createConnection({ host: SMTP_HOST, port: SMTP_PORT });
  socket.setTimeout(SMTP_TIMEOUT_MS);

  const body = `You requested a password reset.\nReset link: ${resetLink}\n`;
  const headers = [
    `From: ${SMTP_FROM}`,
    `To: ${to}`,
    'Subject: TimeManager password reset',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  try {
    await sendCommand(socket, null, [220]);
    await sendCommand(socket, 'EHLO timemanager', [250]);
    await sendCommand(socket, `MAIL FROM:<${SMTP_FROM}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await sendCommand(socket, 'DATA', [354]);

    socket.write(`${headers}\r\n.\r\n`);
    await sendCommand(socket, null, [250]);
    await sendCommand(socket, 'QUIT', [221]);

    logger.info({ to }, 'Password reset email sent');
  } finally {
    socket.end();
  }
};

module.exports = { sendPasswordResetEmail };
