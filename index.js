const fastify = require('fastify')({ logger: true });
const { randomBytes } = require('crypto');

// Register form body parsing support
fastify.register(require('@fastify/formbody'));

const backendData = {};
let sessionid = 0;
 //<button data-on-click="$$put('/sessionid')">Send Session</button> </br>
function indexPage() {
  // this only gets set the first time user hits the page
  sessionid++
  const indexPage = `
    <!doctype html><html>
   
      <head>
        <title>Node/Fastify + Datastar Example With Anonymous User Local Storage</title>
        <script type="module" defer src="https://cdn.jsdelivr.net/npm/@sudodevnull/datastar"></script></head>
      <body>
        <h2>Node/Fastify + Datastar Example</h2>
        <main class="container" id="main" data-store='{ input: "", show: false }'>
        <div id="result"></div>
        <p id="name">Hello</p>
        </br>
        <script>
        var foo = new Set();
        foo.add(1);
        foo.add(2);
        foo.add(${sessionid})
        
        localStorage.setItem("set",JSON.stringify([...foo]));
        var x = localStorage.getItem('set');
       // console.log('x: ', JSON.parse(x));
        function setPerson(){
          // var person2 = { 'name': document.getElementById('name').innerHTML}
          var person = {
            // name: document.getElementById('name').value, FAILS
            name: ${sessionid}
           };
      
          // Put the object into storage 
          localStorage.setItem('person', JSON.stringify(person));
          }
          setPerson()
          
          // Retrieve
          let obj = localStorage.getItem("person")
          obj = JSON.parse(obj);
          console.log(obj)
          let na = obj.name
          console.log(na)
          document.getElementById("result").innerHTML = na
          // .name nor .value
          //localStorage.getItem("person").name;
       function getPerson(){
        let name = JSON.parse(localStorage.getItem("person")).name
        console.log('getname ',name)
        ;
       }
       getPerson()
        </script>
     
        <input type="submit" value="click" onclick="getPerson" data-on-click="$$put('/put')" />
       
        <input type="text" placeholder="Type here!" data-model="input" />
       
        <button data-on-click="$$put('/put/${sessionid}')">Send State ${sessionid} </button>
        <div id="output"></div>
        <button data-on-click="$$get('/get/${sessionid}')">Get Backend State ${sessionid} </button>
        <div id="output2"></div>
        <button data-on-click="$show=!$show">Toggle</button>
        <div data-show="$show">
          <span>Hello From Datastar!</span>
        </div>
        <div>
          <span>Feed from server: </span>
          <span id="feed" data-on-load="$$get('/feed')"></span>
        </div>
      </body>
    </html>`;
  return indexPage;
}

function setSSEHeaders(reply) {
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Connection', 'keep-alive');
}

function sendSSE({ reply, frag, selector, merge, mergeType, end }) {
  reply.raw.write('event: datastar-fragment\n');
  if (selector) reply.raw.write(`data: selector ${selector}\n`);
  if (merge) reply.raw.write(`data: merge ${mergeType}\n`);
  reply.raw.write(`data: fragment ${frag}\n\n`);
  if (end) reply.raw.end();
}

// Route handlers
fastify.get('/', async (request, reply) => {
  return reply.type('text/html').send(indexPage());
});
// fastify.put('/sessionid', async (request, reply) => {
//   sessionid++;
//   setSSEHeaders(reply);
//   const output = ` sessionid${sessionid} `;
//   const frag = `<div id="output">${output}</div>`;
//   sendSSE({    reply,    frag,    selector: null,    merge: true,
//     mergeType: 'morph',    end: true  });
//     // We need to return undefined to prevent Fastify from automatically ending the response
//   return undefined;
// });

// send
fastify.put('/put', async (request, reply) => {
  setSSEHeaders(reply);
  const { input } = request.body;
  backendData.input = input;
  const output = `Your input: ${input}, is ${input.length} long. sessionid = ${sessionid} `;
  const frag = `<div id="output">${output}</div>`;
  
  sendSSE({
    reply,
    frag,
    selector: null,
    merge: true,
    mergeType: 'morph',
    end: true
  });
  
  // We need to return undefined to prevent Fastify from automatically ending the response
  return undefined;
});
fastify.put('/put/:session_id', async (request, reply) => {
  const {
    session_id
  } = request.params;
  setSSEHeaders(reply);
  const { input } = request.body;
  backendData.input = input;
  // const output = `Your input: ${input}, is ${input.length} long. sessionid = ${sessionid} `;
  const output = `Your input: ${input}, is ${input.length} long. sessionid = ${session_id} `;
 const frag = `<div id="output">${output}</div>`;
  
  sendSSE({
    reply,
    frag,
    selector: null,
    merge: true,
    mergeType: 'morph',
    end: true
  });
  
  // We need to return undefined to prevent Fastify from automatically ending the response
  return undefined;
});
// fastify.get('/get', async (request, reply) => {
  fastify.get('/get/:session_id', async (request, reply) => {
    const {
      session_id
    } = request.params;
    setSSEHeaders(reply);
  
  const output = `Backend State: ${JSON.stringify(backendData)}.`;
  let frag = `<div id="output2">${output} sessionid = ${session_id}</div>`;

  sendSSE({
    reply,
    frag,
    selector: null,
    merge: true,
    mergeType: 'morph',
    end: false
  });

  return undefined;
});

fastify.get('/feed', async (request, reply) => {
  setSSEHeaders(reply);
  
  // Create an async iterator for the SSE feed
  const feedHandler = async () => {
    while (!reply.raw.destroyed) {
      const rand = randomBytes(8).toString('hex');
      const frag = `<span id="feed">${rand}</span>`;
      
      sendSSE({
        reply,
        frag,
        selector: null,
        merge: false,
        mergeType: null,
        end: false
      });

      await new Promise(resolve => setTimeout(resolve, 5000));//1000
    }
    reply.raw.end();
  };

  feedHandler().catch(err => {
    fastify.log.error(err);
    if (!reply.raw.destroyed) {
      reply.raw.end();
    }
  });

  return undefined;
});

// Start the server
const start = async () => {
  try {
    const PORT = process.env.PORT || 3000;
    await fastify.listen({ port: PORT });
    fastify.log.info(`Server is running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
