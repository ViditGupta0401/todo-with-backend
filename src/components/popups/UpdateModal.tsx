import React from 'react';

interface UpdateModalProps {
  version: string;
  changelog: string[];
}

const UpdateModal: React.FC<UpdateModalProps> = ({ version, changelog }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What's New (v{version})</h2>
      <ul className="list-disc pl-6 mb-4">
        {changelog.map((item, idx) => (
          <li key={idx} className="mb-1 text-base">{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default UpdateModal; 