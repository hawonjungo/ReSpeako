 import  { useContext} from 'react';
 import { ThemeContext } from './ThemeContext';



const StarBorder = ({
  Component = "div",
  className = "",
  color = "white",
  speed = "3s",
  children,
  ...rest
}) => {
   const { darkMode } = useContext(ThemeContext);
  return (
    <Component
      className={`relative  py-[1px] overflow-hidden rounded-[20px] ${className}`}
      {...rest}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full star-move-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full star-move-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      ></div>
      <div className={`relative z-1 ${darkMode ? ' bg-gradient-to-b from-black to-gray-900 text-white border-gray-800' : 'bg-gradient-to-b from-gray-100 to-gray-300 text-black border-gray-200'} border   text-center text-[16px] py-[16px] px-[26px] rounded-[20px]`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
