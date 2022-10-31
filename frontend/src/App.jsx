// I used this resource to learn about the Drag and Drop API.
// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API

// https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt

// I have not implemented the feature of inserting a block between two other blocks.

import { useState } from "react"

const LETTERS = ['A','B','C','D','E']
const ARITHMETIC_OPERATORS = ['+','-','*','/']
const COMPARISION_OPERATORS = ['>', '<']

// A symbol which can be dragged.
function DraggableSymbol({ symbol, className }) {
  function dragstart(e) {
    e.dataTransfer.setData('text/plain', symbol)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={true}
      onDragStart={dragstart}
      className={className}>
        <span>{symbol}</span>
    </div>
  )
}

// The symbol in the equation.
function EquationSymbol({ symbol, removeSymbol, className }) {
  return (
    <div className={className}>
      <button onClick={removeSymbol}>X</button>
      <span>{symbol}</span>
    </div>
  )
}

function Equation({ equation, setEquation }) {
  function dragover(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function drop(e) {
    e.preventDefault()
    const symbol = e.dataTransfer.getData('text/plain')
    // Add check to make sure symbol lies in LETTERS or ARITHMETIC_OPERATORS
    if (LETTERS.findIndex(letter => letter === symbol) === -1 && ARITHMETIC_OPERATORS.findIndex(operator => operator === symbol) === -1) {
      return
    }
    setEquation([...equation, symbol])
  }

  return (
    <div className="equation"
      onDrop={drop}
      onDragOver={dragover}>
        {equation.map((symbol, index) => {
          function removeSymbol() {
            setEquation([...equation.slice(0, index), ...equation.slice(index + 1)])
          }

          let className
          if (LETTERS.findIndex(letter => letter === symbol) !== -1) {
            className = 'equationSymbol letterSymbol'
          }
          else if (Number.isInteger(symbol)) {
            className = 'equationSymbol number'
          }
          else {
            className = 'equationSymbol nonLetterSymbol'
          }

          return <EquationSymbol key={index} symbol={symbol} removeSymbol={removeSymbol} className={className}/>
        })}
    </div>
  )
}

function App() {
  const [equation, setEquation] = useState([])
  const [disabled, setDisabled] = useState(false)

  async function evaluate() {
    if (disabled) {
      return
    }

    // Equation must have an odd number of blocks (alternate between letters/numbers and operator), 
    // and must have a length >= 3.
    if (equation.length % 2 === 0 || equation.length < 3) {
      alert('Invalid equation')
      return
    }

    // Check alternation pattern between letter and symbol.
    for (let i = 0; i < equation.length - 2; i++) {
      if (i % 2 == 0 && LETTERS.findIndex(letter => letter === equation[i]) === -1) {
        alert('Invalid equation')
        return
      }
      if (i % 2 == 1 && ARITHMETIC_OPERATORS.findIndex(operator => operator === equation[i]) === -1) {
        alert('Invalid equation')
        return
      }
    }

    // Check that the second last term is an operator.
    if (COMPARISION_OPERATORS.findIndex(operator => operator === equation[equation.length - 2]) === -1) {
      alert('Invalid equation')
      return
    }

    // Check that the last term is the RHS number. (I assume the RHS is only the number.)
    if (!Number.isInteger(equation[equation.length - 1])) {
      alert('Invalid equation')
      return
    }

    // Find the list of all distinct letters.
    let equationLetters = new Set()
    for (let i = 0; i < equation.length - 2; i += 2) {
      equationLetters.add(equation[i])
    }
    equationLetters = Array.from(equationLetters)

    // Find the values of the letters in the equation.
    let equationLetterAndValues = new Map()
    setDisabled(true)
    try {
      for (let i = 0; i < equationLetters.length; i++) {
        const response = await fetch(`/api/${equationLetters[i]}`)
        const json = await response.json()
        if (!response.ok) {
          throw new Error('Non ok response')
        }
        else {
          equationLetterAndValues.set(equationLetters[i], json.value)
        }
      }
    } catch (err) {
      setDisabled(false)
      return
    }

    // Evaluate the expression.
    let equationString = ''
    for (let i = 0; i < equation.length - 2; i++) {
      if (i % 2 === 0) {
        equationString += equationLetterAndValues.get(equation[i]) + ' '
      }
      else {
        equationString += equation[i] + ' '
      }
    }
    equationString += equation[equation.length - 2] + ' ' + equation[equation.length - 1]
    alert(eval(equationString))
    setDisabled(false)
  }

  return (
    <div className="App">
      <div className="letters">
        { 
          LETTERS.map(letter => {
            return <DraggableSymbol symbol={letter} className="letterSymbol" key={letter}/>
          }) 
        }
      </div>
      <div className="nonLetters">
        <div className="arithmeticOperators">
          { 
            ARITHMETIC_OPERATORS.map(operator => {
              return <DraggableSymbol symbol={operator} className="nonLetterSymbol" key={operator}/>
            })
          }
        </div>
        <div>
          { 
            COMPARISION_OPERATORS.map(operator => {
              return <div className="nonLetterSymbol" onClick={() => { setEquation([...equation, operator]) }} key={operator}>{operator}</div>
            })
          }
        </div>
        <div 
          className="nonLetterSymbol"
          onClick = {
            () => {
              let rhs = prompt('Enter the RHS')
              while(isNaN(Number.parseInt(rhs))) {
                rhs = prompt('Please enter a valid RHS')
              }
              rhs = Number.parseInt(rhs)
              setEquation([...equation, rhs])
            }
          }>RHS Integer</div>
      </div>
      <Equation equation={equation} setEquation={setEquation} />
      <button className="evaluate" onClick={evaluate} disabled={disabled}>Evaluate</button>
    </div>
  )
}

export default App
