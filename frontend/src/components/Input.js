const Input = ({ type, placeholder, value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
};

export default Input;
