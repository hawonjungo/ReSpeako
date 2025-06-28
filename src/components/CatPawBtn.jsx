import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 

const CatPawBtn = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    const navigate = useNavigate(); 

    const radius = 90;
    const numButtons = 3;
    const buttonLabels = ["IPA", "Vowels Duel", "Sound Vault"];
    const handleClick = (index) => {
        if (index === 0) navigate("/ipa-pronounce");
        // Add more navigation 
    }


    return (
        <>
            {/* Fullscreen Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-10 bg-black/30 backdrop-blur-sm transition-all"
                    onClick={toggle}
                ></div>
            )}

            {/* Floating Action Area */}
            <div className="absolute bottom-0 right-2 z-20 w-40 h-40 flex items-center justify-center">
                {/* Main Button */}
                <button
                    onClick={toggle}
                    className={`z-30 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg transform transition-all duration-300 ease-out`}
                    style={{
                        transform: isOpen ? `translate(0, 0) scale(1.8)` : 'translate(40px, 40px) ',
                    }}
                >
                    +
                </button>

                {/* Child Buttons with Labels */}
                {[...Array(numButtons)].map((_, index) => {
                    const angle = ((index + 1) * Math.PI) / (numButtons );
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * -radius;

                    return (
                        <div
                            key={index}
                            className="absolute"
                            style={{
                                transform: isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)',
                                transition: 'transform 0.3s ease-out',
                                opacity: isOpen ? 1 : 0,
                                pointerEvents: isOpen ? 'auto' : 'none',
                            }}
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Sub Button */}
                                <button
                                    onClick={() => handleClick(index)}
                                    className={`absolute w-15 h-15 rounded-full 
                                    border-2 border-yellow-400 bg-white/60 
                                    flex items-center justify-center text-xs text-black text-center p-1
                                    transition-opacity duration-300`}
                                >
                                    {buttonLabels[index]}
                                </button>

                                        
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default CatPawBtn;
