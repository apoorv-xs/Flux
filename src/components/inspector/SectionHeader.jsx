
import { ChevronDown } from 'lucide-react';

export default function SectionHeader({ icon: Icon, title, open, onToggle }) {
  return (
    <div
      className={`section-header ${open ? 'open' : ''}`}
      onClick={onToggle}
    >
      <div className="icon">
        <Icon size={13} />
      </div>
      <span className="title">{title}</span>
      <div className="chevron">
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
