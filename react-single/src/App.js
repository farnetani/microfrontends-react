import React, { useState } from 'react'

// A propriedade name abaixo será o nome do nosso microfrontend: `@mc/react-single`
const App = ({ name }) => {
  const [counter, updateCounter] = useState(0)

  const handleChange = type => {
    updateCounter(oldCounter => oldCounter + type)
  }

  return (
    <>
      <h1>{name}</h1>
      <h3>Counter: {counter}</h3>
      <button onClick={() => handleChange(-1)}>Decrement</button>
      <button onClick={() => handleChange(1)}>Increment</button>
    </>
  )
}

export default App