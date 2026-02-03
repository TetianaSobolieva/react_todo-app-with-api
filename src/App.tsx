import React, { useEffect, useRef, useState } from 'react';
import {
  createTodo,
  getTodos,
  deleteTodo,
  USER_ID,
  updateTodo,
} from './api/todos';
import { Todo } from './types/Todo';
import { Header } from './components/Header';
import { TodoList } from './components/todoList';
import { Footer } from './components/Footer';
import { Error } from './components/Error';
import { Filter } from './types/Filter';
import { ErrorMessage } from './types/ErrorMessage';

function getFilteredTodos(todos: Todo[], filterBy: Filter) {
  return todos.filter(todo => {
    if (filterBy === Filter.ACTIVE) {
      return !todo.completed;
    }

    if (filterBy === Filter.COMPLETED) {
      return todo.completed;
    }

    return true;
  });
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingIds, setLoadingIds] = useState<number[]>([]);
  const [error, setError] = useState<ErrorMessage>(ErrorMessage.None);
  const [status, setStatus] = useState<Filter>(Filter.ALL);
  const [title, setTitle] = useState<string>('');
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => inputRef.current?.focus();

  const hasCompletedTodos = todos.some(todo => todo.completed);
  const filteredTodos = getFilteredTodos(todos, status);
  const countActiveTodo = todos.filter(element => !element.completed).length;

  useEffect(() => {
    getTodos()
      .then(fetchedTodos => {
        setTodos(fetchedTodos);
      })
      .catch(() => setError(ErrorMessage.Load))
      .finally(() => setIsLoadingTodos(false));
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => setError(ErrorMessage.None), 3000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    focusInput();
  }, [tempTodo, inputRef]);

  const handleStatusChange = (newStatus: Filter) => {
    setStatus(newStatus);
  };

  // adding new todo

  const handleSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (tempTodo) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError(ErrorMessage.EmptyTitle);

      return;
    }

    const temp: Todo = {
      id: 0,
      userId: USER_ID,
      title: trimmedTitle,
      completed: false,
    };

    setTempTodo(temp);

    createTodo(trimmedTitle)
      .then(todoFromServer => {
        setTodos(currentTodos => [...currentTodos, todoFromServer]);
        setTitle('');
      })
      .catch(() => {
        setError(ErrorMessage.Add);
      })
      .finally(() => {
        setTempTodo(null);
        focusInput();
      });
  };

  // delete todo
  const handleDelete = (id: number) => {
    setLoadingIds(current => [...current, id]);

    deleteTodo(id)
      .then(() => {
        setTodos(currentTodos => currentTodos.filter(todo => todo.id !== id));
      })
      .catch(() => {
        setError(ErrorMessage.Delete);
      })
      .finally(() => {
        setLoadingIds(current => current.filter(currentId => currentId !== id));
        focusInput();
      });
  };

  const clearCompleted = () => {
    todos.filter(todo => todo.completed).forEach(todo => handleDelete(todo.id));
  };

  const clearError = () => {
    setError(ErrorMessage.None);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleChangeStatus = (todo: Todo) => {
    const updatedTodo = { ...todo, completed: !todo.completed };

    setLoadingIds(current => [...current, todo.id]);

    updateTodo(updatedTodo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(t => (t.id === updatedTodo.id ? updatedTodo : t)),
        );
      })
      .catch(() => {
        setError(ErrorMessage.Update);
      })
      .finally(() => {
        setLoadingIds(current =>
          current.filter(currentId => currentId !== todo.id),
        );
        focusInput();
      });
  };

  const allTodosCompleted = (incomeTodos: Todo[]) =>
    incomeTodos.length > 0 && incomeTodos.every(todo => todo.completed);

  function handleToggleAllButton(todosToToggle: Todo[]) {
    const areAllCompleted = allTodosCompleted(todosToToggle);
    const newCompletedValue = !areAllCompleted;

    const todosForUpdate = todosToToggle.filter(
      todo => todo.completed !== newCompletedValue,
    );

    setLoadingIds(current => [
      ...current,
      ...todosForUpdate.map(todo => todo.id),
    ]);

    todosForUpdate.forEach(todo => {
      const updatedTodo = { ...todo, completed: newCompletedValue };

      updateTodo(updatedTodo)
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.map(t => (t.id === todo.id ? updatedTodo : t)),
          );
        })
        .catch(() => {
          setError(ErrorMessage.Update);
        })
        .finally(() => {
          setLoadingIds(current =>
            current.filter(currentId => currentId !== todo.id),
          );
          focusInput();
        });
    });
  }

  const handleUpdateTodo = async (updatedTodo: Todo): Promise<boolean> => {
    setLoadingIds(current => [...current, updatedTodo.id]);

    try {
      await updateTodo(updatedTodo);

      setTodos(currentTodos =>
        currentTodos.map(todo =>
          todo.id === updatedTodo.id ? updatedTodo : todo,
        ),
      );

      return true;
    } catch {
      setError(ErrorMessage.Update);

      return false;
    } finally {
      setLoadingIds(current => current.filter(id => id !== updatedTodo.id));
      focusInput();
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          title={title}
          disabled={Boolean(tempTodo)}
          handleTitleChange={handleTitleChange}
          handleSubmitForm={handleSubmitForm}
          inputRef={inputRef}
          allCompleted={allTodosCompleted(todos)}
          handleToggleAllButton={handleToggleAllButton}
          isLoadingTodos={isLoadingTodos}
        />

        {(todos.length > 0 || tempTodo) && (
          <TodoList
            todos={filteredTodos}
            tempTodo={tempTodo}
            loadingIds={loadingIds}
            handleDelete={handleDelete}
            handleChangeStatus={handleChangeStatus}
            handleUpdateTodo={handleUpdateTodo}
          />
        )}

        {todos.length > 0 && (
          <Footer
            status={status}
            count={countActiveTodo}
            handleStatusChange={handleStatusChange}
            clearCompleted={clearCompleted}
            hasCompletedTodos={hasCompletedTodos}
          />
        )}
      </div>

      <Error error={error} clearError={clearError} />
    </div>
  );
};
