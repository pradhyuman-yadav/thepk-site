/**
 * ErrorMessage component
 * Displays error information when content fails to load
 * @param {String} message - Error message to display
 */
const ErrorMessage = ({ message = 'An error occurred while loading content' }) => {
  return (
    <div className="error-message-container">
      <div className="error-message">
        <h3>Error</h3>
        <p>{message}</p>
        <p className="error-note">Using fallback data to ensure the page still displays.</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
