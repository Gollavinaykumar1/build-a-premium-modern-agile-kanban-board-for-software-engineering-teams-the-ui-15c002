# main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import Column, String, Integer, Enum, DateTime
from sqlalchemy.orm import Session
from database import Base, engine, get_db
from datetime import datetime, timedelta
from typing import List

# Define the Ticket model
class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    priority = Column(Enum("Low", "Medium", "High", "Critical"))
    assignee = Column(String)
    column = Column(Enum("To Do", "In Progress", "Code Review", "Done"))

# Define the Metric model
class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True)
    total_tickets = Column(Integer)
    active_sprint_days_remaining = Column(Integer)
    completion_percentage = Column(Integer)

Base.metadata.create_all(engine)

app = FastAPI()

# Endpoint to get all tickets
@app.get("/tickets/")
def get_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).all()

# Endpoint to create a new ticket
@app.post("/tickets/")
def create_ticket(title: str, priority: str, assignee: str, db: Session = Depends(get_db)):
    new_ticket = Ticket(title=title, priority=priority, assignee=assignee, column="To Do")
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# Endpoint to update a ticket's column
@app.put("/tickets/{ticket_id}/column")
def update_ticket_column(ticket_id: int, column: str, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.column = column
    db.commit()
    db.refresh(ticket)
    return ticket

# Endpoint to get all metrics
@app.get("/metrics/")
def get_metrics(db: Session = Depends(get_db)):
    metrics = db.query(Metric).all()
    if not metrics:
        return {"total_tickets": 0, "active_sprint_days_remaining": 0, "completion_percentage": 0}
    return metrics[0]

# Endpoint to update metrics
@app.put("/metrics/")
def update_metrics(total_tickets: int, active_sprint_days_remaining: int, completion_percentage: int, db: Session = Depends(get_db)):
    metrics = db.query(Metric).all()
    if not metrics:
        new_metric = Metric(total_tickets=total_tickets, active_sprint_days_remaining=active_sprint_days_remaining, completion_percentage=completion_percentage)
        db.add(new_metric)
        db.commit()
        db.refresh(new_metric)
        return new_metric
    else:
        metrics[0].total_tickets = total_tickets
        metrics[0].active_sprint_days_remaining = active_sprint_days_remaining
        metrics[0].completion_percentage = completion_percentage
        db.commit()
        db.refresh(metrics[0])
        return metrics[0]

# Endpoint to get the Kanban board layout
@app.get("/kanban/")
def get_kanban(db: Session = Depends(get_db)):
    to_do = db.query(Ticket).filter(Ticket.column == "To Do").all()
    in_progress = db.query(Ticket).filter(Ticket.column == "In Progress").all()
    code_review = db.query(Ticket).filter(Ticket.column == "Code Review").all()
    done = db.query(Ticket).filter(Ticket.column == "Done").all()
    return {"To Do": to_do, "In Progress": in_progress, "Code Review": code_review, "Done": done}

# Endpoint to get the top metric strip
@app.get("/metric_strip/")
def get_metric_strip(db: Session = Depends(get_db)):
    total_tickets = db.query(Ticket).all()
    active_sprint_days_remaining = db.query(Metric).all()
    if not active_sprint_days_remaining:
        active_sprint_days_remaining = 0
    else:
        active_sprint_days_remaining = active_sprint_days_remaining[0].active_sprint_days_remaining
    completion_percentage = db.query(Metric).all()
    if not completion_percentage:
        completion_percentage = 0
    else:
        completion_percentage = completion_percentage[0].completion_percentage
    return {"Total Tickets": len(total_tickets), "Active Sprint Days Remaining": active_sprint_days_remaining, "Completion Percentage": completion_percentage}