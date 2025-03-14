const Input = ({ label, type = "text", value, onChange, placeholder }) => {
    return (
      <div className="mb-4">
        <label className="block text-gray-700">{label}</label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
        />
      </div>
    );
  };
  
  export default Input;
  