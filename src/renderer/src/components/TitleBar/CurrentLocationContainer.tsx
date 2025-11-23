import { useLocation } from '@tanstack/react-router';

const CurrentLocationContainer = () => {
  const location = useLocation();

  return (
    <div className="text-font-color-dimmed dark:text-dark-font-color-dimmed text-sm">
      {location.href}
    </div>
  );
};

export default CurrentLocationContainer;
