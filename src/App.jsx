import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import { AiOutlinePlus } from 'react-icons/ai';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const App = () => {
  const [tickets, setTickets] = useState([]);
  const [columns, setColumns] = useState([
    { id: 1, title: 'To Do', cards: [] },
    { id: 2, title: 'In Progress', cards: [] },
    { id: 3, title: 'Code Review', cards: [] },
    { id: 4, title: 'Done', cards: [] }
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [priority, setPriority] = useState('Low');
  const [assignee, setAssignee] = useState('');
  const [title, setTitle] = useState('');
  const [totalTickets, setTotalTickets] = useState(0);
  const [activeSprintDaysRemaining, setActiveSprintDaysRemaining] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const { register, handleSubmit, reset } = useForm();

  const fetchTickets = useCallback(async () => {
    try {
      const response = await axios.get(`${BASE_URL}/tickets`);
      const safeList = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setTickets(safeList);
      safeList.forEach((ticket) => {
        const column = columns.find((column) => column.id === ticket.columnId);
        if (column) {
          column.cards.push(ticket);
        }
      });
      setColumns([...columns]);
    } catch (error) {
      console.error(error);
    }
  }, [columns]);

  const handleAddTicket = async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/tickets`, {
        title: data.title,
        priority: data.priority,
        assignee: data.assignee,
        columnId: 1
      });
      setTickets([...tickets, response.data]);
      const column = columns.find((column) => column.id === 1);
      column.cards.push(response.data);
      setColumns([...columns]);
      setModalOpen(false);
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = async (event, columnId) => {
    const ticketId = event.dataTransfer.getData('ticketId');
    const ticket = tickets.find((ticket) => ticket.id === parseInt(ticketId));
    if (ticket) {
      try {
        await axios.put(`${BASE_URL}/tickets/${ticketId}`, {
          columnId: columnId
        });
        const newColumns = [...columns];
        newColumns.forEach((column) => {
          column.cards = column.cards.filter((card) => card.id !== ticketId);
        });
        const column = newColumns.find((column) => column.id === columnId);
        column.cards.push(ticket);
        setColumns(newColumns);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handlePriorityChange = (event) => {
    setPriority(event.target.value);
  };

  const handleAssigneeChange = (event) => {
    setAssignee(event.target.value);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    const totalTickets = tickets.length;
    const activeSprintDaysRemaining = 14; // assuming a 2-week sprint
    const completionPercentage = (tickets.filter((ticket) => ticket.columnId === 4).length / totalTickets) * 100;
    setTotalTickets(totalTickets);
    setActiveSprintDaysRemaining(activeSprintDaysRemaining);
    setCompletionPercentage(completionPercentage);
  }, [tickets]);

  return (
    <HashRouter>
      <div className="h-screen w-screen bg-gray-900 text-white">
        <header className="flex justify-between p-4 bg-gray-800">
          <h1 className="text-3xl font-bold">Agile Kanban Board</h1>
          <div className="flex items-center">
            <button
              className={clsx(
                'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                'transition-all duration-300 hover:scale-105'
              )}
              onClick={() => setModalOpen(true)}
            >
              <AiOutlinePlus size={20} className="mr-2" />
              Add Ticket
            </button>
          </div>
        </header>
        <main className="p-4 flex-1 overflow-y-scroll">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold">Metrics</h2>
            <div className="flex items-center">
              <span className="text-lg font-bold">Total Tickets: {totalTickets}</span>
              <span className="text-lg font-bold ml-4">Active Sprint Days Remaining: {activeSprintDaysRemaining}</span>
              <span className="text-lg font-bold ml-4">Completion Percentage: {completionPercentage.toFixed(2)}%</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {columns.map((column) => (
              <div
                key={column.id}
                className={clsx(
                  'bg-gray-700 rounded p-4',
                  'transition-all duration-300 hover:scale-105'
                )}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, column.id)}
              >
                <h2 className="text-2xl font-bold mb-2">{column.title}</h2>
                <span className="text-lg font-bold mb-2">Cards: {column.cards.length}</span>
                {column.cards.map((card) => (
                  <div
                    key={card.id}
                    className={clsx(
                      'bg-gray-600 rounded p-2 mb-2',
                      'transition-all duration-300 hover:scale-105'
                    )}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('ticketId', card.id.toString())}
                  >
                    <h3 className="text-lg font-bold">{card.title}</h3>
                    <span className="text-lg font-bold">
                      Priority: {card.priority}
                    </span>
                    <span className="text-lg font-bold ml-2">
                      Assignee: {card.assignee}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
        {modalOpen && (
          <div
            className={clsx(
              'fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center',
              'transition-all duration-300'
            )}
          >
            <div
              className={clsx(
                'bg-gray-700 rounded p-4',
                'transition-all duration-300'
              )}
            >
              <h2 className="text-2xl font-bold mb-2">Add Ticket</h2>
              <form onSubmit={handleSubmit(handleAddTicket)}>
                <div className="mb-2">
                  <label className="text-lg font-bold">Title:</label>
                  <input
                    type="text"
                    className={clsx(
                      'bg-gray-600 rounded p-2 w-full',
                      'transition-all duration-300 hover:scale-105'
                    )}
                    {...register('title')}
                    value={title}
                    onChange={handleTitleChange}
                  />
                </div>
                <div className="mb-2">
                  <label className="text-lg font-bold">Priority:</label>
                  <select
                    className={clsx(
                      'bg-gray-600 rounded p-2 w-full',
                      'transition-all duration-300 hover:scale-105'
                    )}
                    value={priority}
                    onChange={handlePriorityChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="text-lg font-bold">Assignee:</label>
                  <input
                    type="text"
                    className={clsx(
                      'bg-gray-600 rounded p-2 w-full',
                      'transition-all duration-300 hover:scale-105'
                    )}
                    value={assignee}
                    onChange={handleAssigneeChange}
                  />
                </div>
                <button
                  type="submit"
                  className={clsx(
                    'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                    'transition-all duration-300 hover:scale-105'
                  )}
                >
                  Add Ticket
                </button>
                <button
                  type="button"
                  className={clsx(
                    'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2',
                    'transition-all duration-300 hover:scale-105'
                  )}
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    </HashRouter>
  );
};

export default App;