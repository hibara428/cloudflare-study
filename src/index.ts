type Bindings = {
    article: KVNamespace;
};

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { etag } from 'hono/etag';

export type Post = {
    datetime: number;
    text: string;
    lat?: string;
    lon?: string;
    location?: string;
    images?: string[];
};
export type Param = {
    text: string;
    lat?: string;
    lon?: string;
    location?: string;
    images?: string[];
};

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors(), etag());

app.get('/', async (context) => {
    const keys = await context.env.article.list();
    return context.json(
        {
            message: 'ok',
            data: keys.keys,
        },
        200
    );
});

app.post('/post', async (context) => {
    try {
        const param = await context.req.json<Param>();
        if (!param.text) throw new Error('text is required');
        const datetime = Math.floor(Date.now() / 1000);
        const post: Post = {
            datetime: datetime,
            text: param.text,
            lat: param.lat,
            lon: param.lon,
            location: param.location,
            images: param.images,
        };
        await context.env.article.put(datetime.toString(), JSON.stringify(post));
        return context.json({ message: 'ok', id: datetime }, 200);
    } catch (e: any) {
        console.log(e.message);
        return context.json({ error: 'invalid request' }, 400);
    }
});

app.get('/post/:id', async (context) => {
    const id = context.req.param('id');
    const post = await context.env.article.get(id);
    if (!post) return context.json({ error: 'not found' }, 404);

    return context.json({ message: 'ok', data: JSON.parse(post) as Post }, 200);
});

app.delete('/post/:id', async (context) => {
    const id = context.req.param('id');
    const post = await context.env.article.get(id);
    if (!post) return context.json({ error: 'not found' }, 404);
    await context.env.article.delete(id);
    return context.json({ message: 'ok' }, 200);
});

export default app;
