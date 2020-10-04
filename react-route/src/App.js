import React, { useState } from "react";

const App = ({ name }) => {
  const [task, updateTask] = useState("");

  const handleChange = (event) => {
    updateTask(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("SALVANDO...");
    updateTask("");
  };

  return (
    <>
      <h1>{name}</h1>
      <form onSubmit={handleSubmit}>
        <input onChange={handleChange} value={task} />
        <button>Add</button>
      </form>
    </>
  );
};

export default App;
