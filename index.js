const fastify = require('fastify')({ logger: true });
const { randomBytes } = require('crypto');

// Register form body parsing support
fastify.register(require('@fastify/formbody'));

const backendData = {};

function indexPage() {
  const indexPage = `
    <!doctype html><html>
      <head>
        <title>Node/Fastify + Datastar Example</title>
        <script type="module" defer src="https://cdn.jsdelivr.net/npm/@sudodevnull/datastar"></script></head>
      <body>
        <h2>Node/Fastify + Datastar Example</h2>
        <main class="container" id="main" data-store='{ input: "", show: false }'>
        <input type="text" placeholder="Type here!" data-model="input" />
        <button data-on-click="$$put('/put')">Send State</button>
        <div id="output"></div>
        <button data-on-click="$$get('/get')">Get Backend State</button>
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

fastify.put('/put', async (request, reply) => {
  setSSEHeaders(reply);
  const { input } = request.body;
  backendData.input = input;
  const output = `Your input: ${input}, is ${input.length} long.`;
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

fastify.get('/get', async (request, reply) => {
  setSSEHeaders(reply);

  const output = `Backend State: ${JSON.stringify(backendData)}.`;
  let frag = `<div id="output2">${output}</div>`;

  sendSSE({
    reply,
    frag,
    selector: null,
    merge: true,
    mergeType: 'morph',
    end: false
  });

  frag = `<div id="output3">Check this out!</div>`;
  sendSSE({
    reply,
    frag,
    selector: '#main',
    merge: true,
    mergeType: 'prepend',
    end: true
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

      await new Promise(resolve => setTimeout(resolve, 1000));
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
