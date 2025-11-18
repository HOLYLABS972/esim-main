"use client";

import React, { useEffect } from 'react';

/**
 * Renders a button that stays visually normal but is not clickable.
 * Optionally applies a red style to a checkbox with the provided id.
 *
 * Props:
 * - children: button content
 * - disabledVisible: when true the button is visible but not clickable
 * - checkboxId: optional id of a checkbox input to mark red while disabledVisible
 * - className: additional classes for the button
 */
const NonClickableButton = ({ children, disabledVisible = false, checkboxId, className = '', ...props }) => {
  useEffect(() => {
    if (!checkboxId) return;
    const el = document.getElementById(checkboxId);
    if (!el) return;

    if (disabledVisible) el.classList.add('checkbox-red');
    else el.classList.remove('checkbox-red');

    return () => {
      if (el) el.classList.remove('checkbox-red');
    };
  }, [checkboxId, disabledVisible]);

  return (
    <button
      type="button"
      // keep normal visual appearance but prevent interaction
      className={`${className} ${disabledVisible ? 'non-clickable-visible' : ''}`}
      aria-disabled={disabledVisible ? 'true' : 'false'}
      tabIndex={disabledVisible ? -1 : 0}
      // onClick is kept for clickable case only
      onClick={disabledVisible ? (e) => e.preventDefault() : props.onClick}
      {...(disabledVisible ? {} : props)}
    >
      {children}
    </button>
  );
};

export default NonClickableButton;
