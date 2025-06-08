import React from 'react';
import { usePopup } from '../../context/PopupContext';
import { UserGuide } from '../UserGuide';

const UserGuidePopup: React.FC = () => {
  const { closePopup } = usePopup();
  
  return <UserGuide onClose={closePopup} />;
};

export default UserGuidePopup;