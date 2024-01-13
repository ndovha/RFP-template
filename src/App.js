import './App.css';
import { db } from './firebase';
import { uid } from 'uid';
import { set, ref, onValue, remove, update } from 'firebase/database';
import { useState, useEffect, useRef } from 'react';
function App() {
  const contentEditableRef = useRef(null);
	const [todo, setTodo] = useState('');
	const [todos, setTodos] = useState([]);
	const [isEdit, setIsEdit] = useState(false);
	const [tempUuid, setTempUuid] = useState('');
	const [visualFeedback, setVisualFeedback] = useState('');
	const [contentUndoStack, setContentUndoStack] = useState([]);
  const [contentRedoStack, setContentRedoStack] = useState([]);

	const handleContentChange = (event, todo, contentEditableRef) => {
		// Update contenteditable area
		const updatedTodos = todos.map((t) =>
			t.uuid === todo.uuid ? { ...t, todo: event.target.innerHTML } : t
		);
    setTodos(updatedTodos);
		// Push the current state to the undo stack
    setContentUndoStack((prev) => [...prev, event.target.innerHTML]);

    // Clear the redo stack when a new change is made
    setContentRedoStack([]);
		// Send a message to the Toolbar app with the selected text
		window.parent.postMessage(
			{
				type: 'contentChange',
				value: {
					todos: updatedTodos,
					selectedText: window.getSelection().toString(),
				},
			},
			'http://localhost:3000/edit-proposal'
		);
	};




  // Function to handle undo action
const handleUndo = () => {
  if (contentUndoStack.length > 1) {
    // Pop the current state from the undo stack
    const currentState = contentUndoStack.pop();
    setContentRedoStack((prev) => [...prev, currentState]);
    contentEditableRef.current.innerHTML = contentUndoStack[contentUndoStack.length - 1];

    // Send a message to the Toolbar app indicating the new state
    window.parent.postMessage({ type: 'contentChange', value: { todos, selectedText: window.getSelection().toString() } }, 'http://localhost:3000/edit-proposal');
  }
};

// Function to handle redo action
const handleRedo = () => {
  if (contentRedoStack.length > 0) {
    // Pop the next state from the redo stack
    const nextState = contentRedoStack.pop();
    setContentUndoStack((prev) => [...prev, nextState]);
    contentEditableRef.current.innerHTML = nextState;

    // Send a message to the Toolbar app indicating the new state
    window.parent.postMessage({ type: 'contentChange', value: { todos, selectedText: window.getSelection().toString() } }, 'http://localhost:3000/edit-proposal');
  }
};

useEffect(() => {
  // Add an event listener to handle messages from the parent
  const handleMessageFromParent = (event) => {
    const { type, value } = event.data;

    if (type === 'undo') {
      // Handle undo logic in TemplateApp
      // Update contenteditable area or perform other undo-related actions
      console.log('Undo triggered in TemplateApp');
      handleUndo();
    } else if (type === 'redo') {
      // Handle redo logic in TemplateApp
      // Update contenteditable area or perform other redo-related actions
      console.log('Redo triggered in TemplateApp');
      handleRedo();
    } else if (type === 'contentChange') {
      // Handle content change in TemplateApp
      // You can update the contenteditable area or perform other actions
      const { selectedText } = value;
      console.log('Content change in TemplateApp:', selectedText);
    } else if (type === 'visualFeedback') {
      // Receive visual feedback from ToolbarApp and update UI accordingly
      setVisualFeedback(value);
    }

  };


  // Attach the event listener
  window.addEventListener('message', handleMessageFromParent);

  // Clean up the event listener on component unmount
  return () => {
    window.removeEventListener('message', handleMessageFromParent);
  };
}, [todos]);

	const handleTodoChange = (e) => {
		setTodo(e.target.value);
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
		setTodo('');
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
		setTodo('');
		setIsEdit(false);
	};
	//delete
	const handleDelete = (todo) => {
		remove(ref(db, `/${todo.uuid}`));
	};

	return (
		<div className='App'>
			<input type='text' value={todo} onChange={handleTodoChange} />
			{isEdit ? (
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
      ) : 
			<button onClick={writeToDatabase}>submit</button>}
			{todos.map((todo) => (
				<div
					style={{
						width: '55%',
						margin: '0 auto',
						border: '2px solid black',
						height: '500px',
						fontSize: '25px',
					}}
					key={todo.uuid}
				>
					<div
						id='editable-content'
            ref={contentEditableRef}
						contentEditable={true}
						// onDoubleClick={handleDoubleClick}
						dangerouslySetInnerHTML={{ __html: todo.todo }}
						onBlur={(event) => handleContentChange(event, todo, contentEditableRef)}
					/>
					<button onClick={() => handleUpdate(todo)}>update</button>
					<button onClick={() => handleDelete(todo)}>delete</button>
				</div>
			))}
		</div>
	);
}
export default App;
{
	/* <meta charset="UTF-8">     
<meta name="viewport" content="width=device-width, initial-scale=1.0">     
<title>RFP</title>   
<style>     
  body {       font-family: sans-serif;     }     
  header {       background-color: #CCEEFF;       padding: 1em;       text-align: center;       font-size: 2em;     }     
  .contact-info {       padding: 1em; background color: white;  }   </style>    
   <header>RFP test</header>   
   <div class="contact-info">     
   <p>Email: example@email.com</p>     
   <p>Phone: (555) 555-5555</p>     
   <p>Address: 123 Main Street, Anytown, USA</p>  
 </div>   */
}
