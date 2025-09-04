import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {Home } from "lucide-react"
const CatPawBtn = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [posY, setPosY] = useState(0);
  const parentRef = useRef(null);
  const dragging = useRef(false);
  const offsetY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const btnHeight = 48; // 12 * 4 px

  // Reset vị trí khi chuyển trang
  useEffect(() => {
    if (parentRef.current) {
      const parentHeight = parentRef.current.offsetHeight;
      setPosY(parentHeight / 2 - btnHeight / 2);
    }
  }, [location.pathname]);

  // Clamp vị trí khi resize
  useEffect(() => {
    const handleResize = () => {
      if (parentRef.current) {
        const parentHeight = parentRef.current.offsetHeight;
        setPosY(prev =>
          Math.max(0, Math.min(parentHeight - btnHeight, prev))
        );
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handlers (vertical only, trong container cha)
  const handleMouseDown = (e) => {
    dragging.current = true;
    const parentRect = parentRef.current.getBoundingClientRect();
    offsetY.current = e.clientY - parentRect.top - posY;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e) => {
    if (!dragging.current || !parentRef.current) return;
    const parentRect = parentRef.current.getBoundingClientRect();
    const newY = e.clientY - parentRect.top - offsetY.current;
    setPosY(Math.max(0, Math.min(parentRect.height - btnHeight, newY)));
  };
  const handleMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  // Mobile
  const handleTouchStart = (e) => {
    dragging.current = true;
    const touch = e.touches[0];
    const parentRect = parentRef.current.getBoundingClientRect();
    offsetY.current = touch.clientY - parentRect.top - posY;
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };
  const handleTouchMove = (e) => {
    if (!dragging.current || !parentRef.current) return;
    const touch = e.touches[0];
    const parentRect = parentRef.current.getBoundingClientRect();
    const newY = touch.clientY - parentRect.top - offsetY.current;
    setPosY(Math.max(0, Math.min(parentRect.height - btnHeight, newY)));
    e.preventDefault();
  };
  const handleTouchEnd = () => {
    dragging.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const toggle = () => {
    if (isOpen) navigate("/");
    setIsOpen(!isOpen);
  };

  const radius = 90;
  const numButtons = 3;
  const buttonLabels = ["IPA", "Vowels Duel", "Sound Vault"];
  const handleClick = (index) => {
    if (index === 0) navigate("/ipa-pronounce");
    if (index === 1) navigate("/loop-lab");
    if (index === 2) navigate("/sound-vault");
    setIsOpen(false);
  };

  return (
    <div ref={parentRef} className="absolute inset-0 pointer-events-none">
      {/* Overlay blur chỉ phủ container cha */}
      {isOpen && (
        <div
          className="absolute inset-0 z-[99] backdrop-blur-md bg-white/30 transition-all pointer-events-auto"
          onClick={toggle}
        />
      )}

      {/* CatPawBtn và các nút con luôn rõ nét, z-index cao hơn */}
      <div
        className="absolute z-[100] flex items-center justify-center pointer-events-auto"
        style={{
          right: 20,
          top: posY,
          transition: 'transform 0.3s cubic-bezier(.4,2,.3,1), box-shadow 0.2s',
          transform: isOpen ? 'translateX(-50px)' : 'translateX(0)',
        }}
      >
        {/* Main Button */}
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg cursor-move justify-items-center bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{
            transform: isOpen ? `scale(1.2)` : '',
            zIndex: 101,
            touchAction: 'none',
            transition: 'transform 0.3s cubic-bezier(.4,2,.3,1)',
          }}
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Child Buttons với animation */}
        {[...Array(numButtons)].map((_, index) => {
          const angle = ((index + 1) * Math.PI) / numButtons;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * -radius;
          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className="absolute w-15 h-15 rounded-full border-2 border-yellow-400 bg-white/60 flex items-center justify-center text-xs text-black text-center p-1 transition-all duration-300"
              style={{
                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                zIndex: 100,
                transition: 'transform 0.3s cubic-bezier(.4,2,.3,1), opacity 0.3s',
              }}
            >
              {buttonLabels[index]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CatPawBtn;