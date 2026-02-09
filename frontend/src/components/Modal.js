import React, { useState, useEffect } from 'react';
import './Modal.css';

function Modal({ isOpen, title, onClose, onSubmit, children, hideSubmitButton = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {!hideSubmitButton && (
          <div className="modal-footer">
            <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
            <button className="modal-btn submit" onClick={() => onSubmit()}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
