interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
}

export default function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center">
        <p className="text-red-800">{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-red-600 hover:text-red-800">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
