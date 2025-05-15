import { v4 as uuidv4 } from 'uuid';

const getUserId = () => {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('userId', id);
  }
  return id;
};

export default getUserId;
