let network;
let matrix = [];
let nodes = [];

function generateMatrix(manual) {
    const size = parseInt(document.getElementById('size').value);
    matrix = Array(size).fill().map(() => Array(size).fill(0));
    nodes = Array(size).fill().map((_, i) => String.fromCharCode(65 + i));

    if (manual) {
        displayMatrixInput(size);
    } else {
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (i !== j && Math.random() < 0.6) {
                    if (i < j && !(i==0 && j==size-1)) {
                        matrix[i][j] = Math.floor(Math.random() * 9) + 1;
                    }
                }
            }
        }
        displayMatrix();
    }
    clearNetwork();
    visualizeNetwork();
    updateNodeSelectors();
    document.getElementById('matrixContainer').classList.remove('hidden');
}

function displayMatrixInput(size) {
    let matrixHtml = '<table>';
    for (let i = 0; i < size; i++) {
        matrixHtml += '<tr>';
        for (let j = 0; j < size; j++) {
            if (i !== j && i < j) {
                matrixHtml += `<td><input type="number" min="0" max="9" value="0" onchange="updateMatrix(${i},${j},this.value)"></td>`;
            } else {
                matrixHtml += '<td>-</td>';
            }
        }
        matrixHtml += '</tr>';
    }
    matrixHtml += '</table>';
    document.getElementById('matrixContainer').innerHTML = matrixHtml;
}

function displayMatrix() {
    let matrixHtml = '<table>';
    for (let i = 0; i < matrix.length; i++) {
        matrixHtml += '<tr>';
        for (let j = 0; j < matrix.length; j++) {
            matrixHtml += `<td>${matrix[i][j]}</td>`;
        }
        matrixHtml += '</tr>';
    }
    matrixHtml += '</table>';
    document.getElementById('matrixContainer').innerHTML = matrixHtml;
}

function updateMatrix(i, j, value) {
    matrix[i][j] = parseInt(value);
    clearNetwork();
    visualizeNetwork();
}

function clearNetwork() {
    if (network) {
        network.destroy();
        network = null;
    }
}

function visualizeNetwork() {
    const visNodes = new vis.DataSet(nodes.map((node, index) => ({ id: index, label: node })));
    const visEdges = new vis.DataSet();

    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix.length; j++) {
            if (matrix[i][j] > 0) {
                visEdges.add({ from: i, to: j, label: matrix[i][j].toString(), arrows: 'to' });
            }
        }
    }

    const container = document.getElementById('mynetwork');
    const data = { nodes: visNodes, edges: visEdges };
    const options = {
        layout: {
            hierarchical: false
        },
        edges: {
            smooth: false
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -8000,
                centralGravity: 0.3,
                springLength: 150,
                springConstant: 0.04,
                damping: 0.09
            }
        }
    };
    network = new vis.Network(container, data, options);
}

function updateNodeSelectors() {
    const sourceSelect = document.getElementById('source');
    const sinkSelect = document.getElementById('sink');
    sourceSelect.innerHTML = '';
    sinkSelect.innerHTML = '';
    for (let i = 0; i < nodes.length; i++) {
        sourceSelect.options.add(new Option(nodes[i], i));
        sinkSelect.options.add(new Option(nodes[i], i));
    }
    sinkSelect.value = nodes.length - 1;
}

function calculateMaxFlow() {
    const source = parseInt(document.getElementById('source').value);
    const sink = parseInt(document.getElementById('sink').value);

    let initialPath = bfs(matrix, source, sink);
    let attempts = 0;

    while (!initialPath && attempts < 5) {
        generateMatrix(false);
        initialPath = bfs(matrix, source, sink);
        attempts++;
    }

    if (!initialPath) {
        document.getElementById('result').innerHTML = "No se pudo generar una matriz con flujo máximo posible entre el nodo de origen y el nodo de destino después de varios intentos.";
    } else {
        const maxFlow = fordFulkerson(matrix, source, sink);
        document.getElementById('result').innerHTML = `Flujo Máximo: ${maxFlow}`;
    }
}

function fordFulkerson(graph, source, sink) {
    const rGraph = _.cloneDeep(graph);
    let maxFlow = 0;

    while (true) {
        const path = bfs(rGraph, source, sink);
        if (!path) break;

        let pathFlow = Infinity;
        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i], v = path[i + 1];
            pathFlow = Math.min(pathFlow, rGraph[u][v]);
        }

        for (let i = 0; i < path.length - 1; i++) {
            const u = path[i], v = path[i + 1];
            rGraph[u][v] -= pathFlow;
            rGraph[v][u] += pathFlow;
        }

        maxFlow += pathFlow;
    }

    return maxFlow;
}

function bfs(rGraph, source, sink) {
    const visited = new Array(rGraph.length).fill(false);
    const queue = [[source]];
    visited[source] = true;

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        for (let next = 0; next < rGraph.length; next++) {
            if (!visited[next] && rGraph[node][next] > 0) {
                const newPath = [...path, next];
                if (next === sink) return newPath;
                visited[next] = true;
                queue.push(newPath);
            }
        }
    }

    return null;
}