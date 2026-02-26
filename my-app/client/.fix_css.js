const fs = require('fs');
const file = 'c:/Users/jatan/OneDrive/Desktop/LifeByDorm/my-app/client/src/pages/dorms/dorms.css';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// The file was corrupted starting from line 1100 (index 1099)
lines = lines.slice(0, 1099);

const css = `
/* Success Toast for Reviews */
.success-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 16px 24px;
  min-width: 320px;
  border-left: 4px solid #4CAF50;
  animation: slideDownFadeIn 0.3s ease-out forwards;
}

@keyframes slideDownFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.toast-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toast-icon {
  color: white;
  background-color: #4CAF50;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.toast-text {
  flex-grow: 1;
}

.toast-text h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 1.05rem;
}

.toast-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
  height: 100%;
  display: flex;
  align-items: center;
}

.toast-close:hover {
  color: #333;
}
`;
lines.push(css);
fs.writeFileSync(file, lines.join('\n'));
console.log("Fixed CSS encoding!");
