export function getBackgroundImageStyle(url) {
  return { backgroundImage: `url(${url})` };
}

export function getDefaultBackgroundUrl() {
  return `${process.env.PUBLIC_URL}/images/halftime.jpg`;
}
