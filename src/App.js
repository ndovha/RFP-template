import './App.css';
import { db } from './firebase';
import { uid } from 'uid';
import { set, ref, onValue, remove, update } from 'firebase/database';
import { useState, useEffect, useRef } from 'react';
import { useTemplateContext } from './utils/TemplateContext';

function App() {
	const contentEditableRef = useRef(null);
	const [todo, setTodo] = useState('');
	const [todos, setTodos] = useState([]);
	const [isEdit, setIsEdit] = useState(false);
	const [tempUuid, setTempUuid] = useState('');
	const [visualFeedback, setVisualFeedback] = useState('');
	const [contentUndoStack, setContentUndoStack] = useState([]);
	const [contentRedoStack, setContentRedoStack] = useState([]);
	const { updateSelectedText, updateTodos } = useTemplateContext();
	const [formattedText, setFormattedText] = useState('');

	useEffect(() => {
		const handleTextSelection = () => {
			const selectedText = window.getSelection().toString();
			console.log(selectedText);
			updateSelectedText(selectedText);
		};

		document.addEventListener('mouseup', handleTextSelection);

		return () => {
			document.removeEventListener('mouseup', handleTextSelection);
		};
	}, [updateSelectedText]);

	const handleContentChange = (event, todo) => {
		// Update contenteditable area
		const updatedTodos = todos.map((t) =>
			t.uuid === todo.uuid ? { ...t, todo: event.target.innerHTML } : t
		);
		// Push the current state to the undo stack
		setContentUndoStack((prev) => [...prev, [...todos]]);

		// Clear the redo stack when a new change is made
		setContentRedoStack([]);

		setTodos(updatedTodos);

		// Send a message to the Toolbar app with the selected text
		window.parent.postMessage(
			{
				type: 'contentChange',
				value: {
					todos: updatedTodos,
					selectedText: window.getSelection().toString(),
					formattedText,
				},
			},
			// 'http://localhost:3000/edit-proposal'
			'*'
		);
	};

	// Function to handle undo action
	const handleUndo = () => {
		if (contentUndoStack.length > 1) {
			const prevTodos = contentUndoStack[contentUndoStack.length - 2];

			setContentUndoStack((prev) => prev.slice(0, -1));
			setContentRedoStack((prev) => [...prev, [...todos]]);

			setTodos(prevTodos);

			window.parent.postMessage(
				{
					type: 'contentChange',
					value: {
						todos: prevTodos,
						selectedText: window.getSelection().toString(),
					},
				},
				'*'
			);
		}
	};
	// Function to handle redo action
	const handleRedo = () => {
		if (contentRedoStack.length > 0) {
			const nextTodos = contentRedoStack[contentRedoStack.length - 1];

			setContentUndoStack((prev) => [...prev, [...todos]]);
			setContentRedoStack((prev) => prev.slice(0, -1));

			setTodos(nextTodos);

			// Send a message to the Toolbar app indicating the new state
			window.parent.postMessage(
				{
					type: 'contentChange',
					value: {
						todos: nextTodos,
						selectedText: window.getSelection().toString(),
					},
				},
				'*'
			);
		}
	};

	useEffect(() => {
		// Add an event listener to handle messages from the parent
		const handleMessageFromParent = (event) => {
			const { type, value } = event.data;
			console.log(value);
			console.log(type);
			if (type === 'undo') {
				console.log('Undo triggered in TemplateApp');
				handleUndo();
			} else if (type === 'redo') {
				console.log('Redo triggered in TemplateApp');
				handleRedo();
			} else if (type === 'contentChange') {
				const { todos: updatedTodos, selectedText } = value;
				setTodos(updatedTodos);
				contentEditableRef.current.innerHTML =
					updatedTodos[updatedTodos.length - 1][0]?.todo || '';
				console.log('Content change in TemplateApp:', selectedText);
				// Update the formatted text in your state or wherever it's stored
				// setFormattedText(formattedText || '');
			} else if (type === 'applyFormat') {
				// Handle the formatted text received from the Toolbar
				console.log('Applying format in TemplateApp:', value);
				// setFormattedText(value.formattedText);
			} else if (type === 'visualFeedback') {
				setVisualFeedback(value);
			}
		};

		setContentUndoStack([todos]);

		window.addEventListener('message', handleMessageFromParent);
		return () => {
			window.removeEventListener('message', handleMessageFromParent);
		};
	}, [todos]);

	const handleTodoChange = (e) => {
		setTodo(e.target.value);
	};

	//read Firabase
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
	//write Firabase
	const writeToDatabase = () => {
		const uuid = uid();
		set(ref(db, `/${uuid}`), {
			todo,
			uuid,
		});
		setTodo('');
	};
	//update Firabase
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
							setTodo('');
						}}
					>
						X
					</button>
				</>
			) : (
				<button onClick={writeToDatabase}>submit</button>
			)}
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
{
	/* <meta charset="UTF-8">     
<meta name="viewport" content="width=device-width, initial-scale=1.0">     
<title>RFP</title>   
<style>     
  body {       font-family: sans-serif;     }     
  header {       background-color: #CCEEFF;       padding: 1em;       text-align: center;       font-size: 2em;     }     
  .contact-info {       padding: 1em; background color: white;  }   </style>    
   <header>REQUEST FOR PROPOSAL (RFP)
     NO. *****</header>   
   <div class="contact-info">     
   <p>Email: example@email.com</p>     
   <p>Phone: (555) 555-5555</p>     
   <p>Address: 123 Main Street, Anytown, USA</p>  
 </div>   */
}
