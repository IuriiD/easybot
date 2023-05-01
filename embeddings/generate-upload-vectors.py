import os
import tiktoken
import openai
import pinecone

import keys

tokenizer = tiktoken.get_encoding("gpt2")

openai.organization = keys.OPENAI_ORG
openai.api_key = keys.OPENAI_KEY

PINECONE_INDEX_NAME = keys.PINECONE_INDEX_NAME
MODEL = "text-embedding-ada-002"
INDEX_DIMENSIONS = 1536 # specific for "text-embedding-ada-002" model

pinecone.init(
    api_key = keys.PINECONE_API_KEY,
    environment = 'us-east1-gcp'
)

# List Pinecone indexes and check if API works
print('Pinecone Indexes: ', pinecone.list_indexes())

# Check requests to OpenAI
print('OpenAI Engines: ', openai.Engine.list())

# # check if PINECONE_INDEX_NAME index already exists (only create index if not)
if PINECONE_INDEX_NAME not in pinecone.list_indexes():
    pinecone.create_index(PINECONE_INDEX_NAME, dimension=INDEX_DIMENSIONS)

# # connect to index
index = pinecone.Index(PINECONE_INDEX_NAME)

# Generate and save embeddings for our txt files
contexts_dir_name = './contexts'
for filename in os.listdir(contexts_dir_name):
    if filename.endswith('.txt'):
        filepath = os.path.join(contexts_dir_name, filename)
        with open(filepath, 'r') as file:
            text = file.read()
            print(f'\n\nProcessing file {filepath}')
            tokens = tokenizer.encode(text)
            print('tokens=', len(tokens))
            
            # create embeddings
            res = openai.Embedding.create(input=[text], engine=MODEL)
            embeds = [record['embedding'] for record in res['data']]
            print('Generated embeddings, dimensions: ', len(embeds[0]))
            
            # prep metadata and prepare vector payload
            meta = {'text': text}
            to_upsert = (
                filename, # vector ID
                embeds, # vector values
                meta) # meta (source text)
            
            # upsert vector to Pinecone
            index.upsert(vectors=[to_upsert])
            print(f'Vector #{filename} was upserted OK')