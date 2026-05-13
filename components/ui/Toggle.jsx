'use client';
import { useState } from 'react';

export default function Toggle({ defaultOn = false, onChange }) {
  const [on, setOn] = useState(defaultOn);
  const toggle = () => {
    setOn(v => {
      onChange?.(!v);
      return !v;
    });
  };
  return (
    <button
      className={`toggle${on ? ' on' : ''}`}
      onClick={toggle}
      aria-pressed={on}
    />
  );
}
