import "./App.css";
import { db } from "./firebase";
import { uid } from "uid";
import { set, ref, onValue, remove, update } from "firebase/database";
import { useState, useEffect } from "react";
function App() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [tempUuid, setTempUuid] = useState("");

  const handleContentChange = (event, todo) => {
    const updatedTodos = todos.map((t) =>
      t.uuid === todo.uuid ? { ...t, todo: event.target.innerHTML } : t
    );
    console.log('Updated Todos:', updatedTodos);
    setTodos(updatedTodos);
    const selectedText = window.getSelection().toString();
    console.log('Selected Text:', selectedText);
    // window.parent.postMessage({ type: 'selectedText', value: event.target.innerHTML }, 'http://localhost:3000/edit-proposal');
    window.parent.postMessage({
      type: 'contentChange',
      todos: updatedTodos,
      selectedText: selectedText,
    }, 'http://localhost:3000/edit-proposal');
  };

  const handleTodoChange = (e) => {
    setTodo(e.target.value);
  };

  useEffect(() => {
// Add an event listener to handle messages from the parent
const handleMessageFromParent = (event) => {
  const { type, value } = event.data;

  if (type === 'getSelection') {
    // Handle the received getSelection message
    console.log('Received getSelection message from Parent');
  } else if (type === 'undo') {
    // Handle the received undo message
    console.log('Received undo message from Parent');
  } else if (type === 'redo') {
    // Handle the received redo message
    console.log('Received redo message from Parent');
  } else if (type === 'selectedText') {
    // Handle the received selectedText
    console.log('Selected Text from Parent:', value);
    setTodo(value);
  } else if (type === 'contentChange') {
    // Handle the received contentChange
    // Extract and use the updated content and todos from the message
    const { todos: updatedTodos, selectedText: updatedSelectedText } = value;
    setTodos(updatedTodos);
    setTodo(updatedSelectedText);
  }
};

// Attach the event listener
window.addEventListener('message', handleMessageFromParent);

// Clean up the event listener on component unmount
return () => {
  window.removeEventListener('message', handleMessageFromParent);
};
  }, []);

  const handleDoubleClick = () => {
    const selectedText = window.getSelection().toString();
    console.log(selectedText)
    window.parent.postMessage({ type: 'selectedText', value: selectedText }, 'http://localhost:3000/edit-proposal');
  };


  //read
  useEffect(() => {
    onValue(ref(db), (snapshot) => {
      setTodos([]);
      const data = snapshot.val();
      if (data !== null) {
        Object.values(data).map((todo) => {
          setTodos((oldArray) => [...oldArray, todo]);
        });
      }
    });
  }, []);
  //write
  const writeToDatabase = () => {
    const uuid = uid();
    set(ref(db, `/${uuid}`), {
      todo,
      uuid,
    });
    setTodo("");
  };
  //update
  const handleUpdate = (todo) => {
    setIsEdit(true);
    setTempUuid(todo.uuid);
    setTodo(todo.todo);
  };
  const handleSubmitChange = () => {
    update(ref(db, `/${tempUuid}`), {
      todo,
      uuid: tempUuid,
    });
    setTodo("");
    setIsEdit(false);
  };
  //delete
  const handleDelete = (todo) => {
    remove(ref(db, `/${todo.uuid}`));
  };
  
  return (
    <div className="App">
      <input type="text" value={todo} onChange={handleTodoChange} />
      {/* {isEdit ? (
        <>
          <button onClick={handleSubmitChange}>Submit Change</button>
          <button
            onClick={() => {
              setIsEdit(false);
              setTodo("");
            }}
          >
            X
          </button>
        </>
      ) :  */}
      <button onClick={writeToDatabase}>submit</button>
      {todos.map((todo) => (
        <div
          style={{
            width: "55%",
            margin: "0 auto",
            border: "2px solid black",
            height: "500px",
            fontSize: "25px",
          }}
          key={todo.uuid}
        >
          <div
            contentEditable={true}
            onDoubleClick={handleDoubleClick}
            dangerouslySetInnerHTML={{ __html: todo.todo }}
            onBlur={(event) => handleContentChange(event, todo)}
          />
          <button onClick={() => handleUpdate(todo)}>update</button>
          <button onClick={() => handleDelete(todo)}>delete</button>
        </div>
      ))}
    </div>
  );
}
export default App;
{/* <meta charset="UTF-8">     
<meta name="viewport" content="width=device-width, initial-scale=1.0">     
<title>RFP</title>   
<style>     
  body {       font-family: sans-serif;     }     
  header {       background-color: #CCEEFF;       padding: 1em;       text-align: center;       font-size: 2em;     }     
  .contact-info {       padding: 1em;   }   </style>    
   <header>RFP test</header>   
   <div class="contact-info">     
   <p>Email: example@email.com</p>     
   <p>Phone: (555) 555-5555</p>     
   <p>Address: 123 Main Street, Anytown, USA</p>  
 </div>   */}