import React, { useState } from 'react';
import classNames from 'classnames';
import { Todo } from '../types/Todo';

type Props = {
  todo: Todo;
  loading?: boolean;
  onDelete?: (id: number) => void;
  onUpdate?: (todo: Todo) => Promise<boolean>;
  handleChangeStatus: (todo: Todo) => void;
};

export const TodoItem: React.FC<Props> = ({
  todo,
  loading = false,
  onDelete,
  onUpdate,
  handleChangeStatus,
}) => {
  const [changeTitle, setChangeTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(todo.title);

  async function handleChangeItem() {
    const trimmedTitle = newTitle.trim();

    setNewTitle(trimmedTitle);

    if (trimmedTitle.length === 0) {
      onDelete?.(todo.id);

      return;
    }

    if (trimmedTitle !== todo.title && onUpdate) {
      const success = await onUpdate({ ...todo, title: trimmedTitle });

      if (!success) {
        return;
      }
    }

    setChangeTitle(false);
  }

  return (
    <div
      data-cy="Todo"
      className={classNames('todo', { completed: todo.completed })}
    >
      <label className="todo__status-label">
        <input
          data-cy="TodoStatus"
          type="checkbox"
          className="todo__status"
          checked={todo.completed}
          aria-label="Toggle todo status"
          disabled={loading}
          onChange={() => handleChangeStatus(todo)}
          readOnly
        />
      </label>
      {changeTitle ? (
        <form
          onSubmit={event => {
            event.preventDefault();
            handleChangeItem();
          }}
        >
          <input
            onKeyUp={event => {
              if (event.key === 'Escape') {
                setChangeTitle(false);
                setNewTitle(todo.title);
              }
            }}
            onBlur={handleChangeItem}
            onChange={event => setNewTitle(event.target.value)}
            data-cy="TodoTitleField"
            type="text"
            className="todo__title-field"
            placeholder="Empty todo will be deleted"
            value={newTitle}
            autoFocus
          />
        </form>
      ) : (
        <>
          <span
            data-cy="TodoTitle"
            className="todo__title"
            onDoubleClick={() => setChangeTitle(true)}
          >
            {todo.title}
          </span>

          {/* Remove button appears only on hover */}
          <button
            type="button"
            className="todo__remove"
            data-cy="TodoDelete"
            disabled={loading}
            onClick={() => onDelete?.(todo.id)}
          >
            ×
          </button>
        </>
      )}

      {/* overlay will cover the todo while it is being deleted or updated */}
      <div
        data-cy="TodoLoader"
        className={classNames('modal overlay', { 'is-active': loading })}
      >
        <div className="modal-background has-background-white-ter" />
        <div className="loader" />
      </div>
    </div>
  );
};
