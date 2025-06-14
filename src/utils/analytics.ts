// Google Analytics utility functions
export const pageview = (url: string) => {
  window.gtag('config', 'G-B4W1CK2TJP', {
    page_path: url,
  });
};

// Track custom events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}; 