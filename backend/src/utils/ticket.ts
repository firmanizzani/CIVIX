const generateTicket = () => {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `LPR-${year}-${seq}`;
};

export default generateTicket;
