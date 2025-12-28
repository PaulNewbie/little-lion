// import React from 'react';

// const Card = ({ title, subtitle, color = 'white', onClick, children, actions }) => {
//   return (
//     <div 
//       onClick={onClick}
//       style={{
//         backgroundColor: 'white',
//         borderRadius: '8px',
//         border: '1px solid #e5e7eb',
//         overflow: 'hidden',
//         boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
//         cursor: onClick ? 'pointer' : 'default',
//         transition: 'transform 0.2s',
//         display: 'flex',
//         flexDirection: 'column',
//         height: '100%'
//       }}
//       onMouseOver={e => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
//       onMouseOut={e => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
//     >
//       {/* Optional Color Strip or Header */}
//       {title && (
//         <div style={{ padding: '15px', borderBottom: '1px solid #f3f4f6', backgroundColor: color !== 'white' ? color : 'white' }}>
//           <h3 style={{ margin: 0, fontSize: '16px', color: color !== 'white' ? 'white' : '#111' }}>{title}</h3>
//           {subtitle && <small style={{ color: color !== 'white' ? 'rgba(255,255,255,0.9)' : '#666' }}>{subtitle}</small>}
//         </div>
//       )}
      
//       <div style={{ padding: '20px', flex: 1 }}>
//         {children}
//       </div>

//       {actions && (
//         <div style={{ padding: '10px 15px', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', gap: '10px' }}>
//           {actions}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Card;