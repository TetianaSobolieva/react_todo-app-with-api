import React from 'react';
import { Todo } from '../types/Todo';
import { TodoItem } from './todoItem';

type Props = {
  todos: Todo[];
  loadingIds: number[];
  tempTodo: Todo | null;
  handleDelete: (id: number) => void;
  handleChangeStatus: (todo: Todo) => void;
};

export const TodoList: React.FC<Props> = ({
  todos,
  loadingIds,
  handleDelete,
  tempTodo,
  handleChangeStatus,
}) => {
  return (
    <section className="todoapp__main" data-cy="TodoList">
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          loading={loadingIds.includes(todo.id)}
          onDelete={handleDelete}
          handleChangeStatus={handleChangeStatus}
        />
      ))}

      {tempTodo && <TodoItem todo={tempTodo} loading />}
    </section>
  );
};
