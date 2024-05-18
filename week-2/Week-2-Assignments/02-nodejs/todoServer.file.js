const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { get } = require("http");

const app = express();

app.use(bodyParser.json());

function getIdx(arr, id) {
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].id === id) {
			return i;
		}
	}
	return -1;
}

app.get("/todos", (req, res) => {
	fs.readFile("todos.json", "utf8", (err, data) => {
		if (err) throw err;
		res.json(JSON.parse(data));
	});
});

app.get("/todos/:id", (req, res) => {
    fs.readFile("todos.json", "utf8", (err, data) => {
        if(err) throw err;
        else{
            const todos = JSON.parse(data);
            const idx = getIdx(todos, parseInt(req.params.id));
            if(idx === -1){
                res.status(404).send();
            }
            else{
                res.json(todos[idx]);
            }
        }
    })
})

app.post("/todos/:id", (req, res) => {
    const todo = {
        id: Math.floor(Math.random()*1000000),
        title: req.body.title,
        description: req.body.description
    }
    fs.readFile("todos.json", "utf8", (err, data) => {
        if(err) throw err;
        else{
            const todos = JSON.parse(data);
            todos.push(todo);
            fs.writeFile("todos.json", JSON.stringify(todos), (err) => {
                if(err) throw err;
                else{
                    res.status(201).json(todo);
                }
            })
        }
    })
})

app.put("todos/:id", (req, res) => {
    fs.readFile("todos.json", "utf8", (err, data) => {
        const todos = JSON.parse(data);
        const idx = getIdx(todos, parseInt(req.params.id));
        if(idx === -1){
            res.status(404).send();
        }
        else{
            const todo = {
                id: todos[idx].id,
                title: req.body.title,
                description: req.body.description
            };
            todos[idx] = todo;
            fs.writeFile("todos.json", "utf8", (err) => {
                if(err) throw err;
                else{
                    res.status(200).json(todo);
                }
            })
        }
    })
})

function deleteIdx(arr, idx){
    newTodos = [];
    for(let i=0; i<arr.length; i++){
        if(i !== idx){
            newTodos.push(arr[i]);
        }
    }
    return newTodos;
}

app.delete("/todos/:id", (req, res) => {
    fs.readFile("todos.json", "utf8", (err, data) => {
        if(err) throw err;
        const idx = getIdx(arr, id);
        if(idx === -1){
            res.status(404).send();
        }
        else{
            todos = deleteIdx(todos, idx);
            fs.writeFile("todos.json", JSON.stringify(todos), (err) => {
                if(err) throw err;
                else{
                    res.status(200).send();
                }
            })
        }
    })
})

app.use((req, res, next) =>{
    res.status(404).send();
})

app.listen(3000);
// module.exports = app;