import tiktoken
import openai
import pinecone

import mysecrets

tokenizer = tiktoken.get_encoding("gpt2")

openai.organization = mysecrets.OPENAI_ORG
openai.api_key = mysecrets.OPENAI_KEY

PINECONE_INDEX_NAME = 'scheppach'
MODEL = "text-embedding-ada-002"
INDEX_DIMENSIONS = 1536

pinecone.init(
    api_key = mysecrets.PINECONE_API_KEY,
    environment = 'us-east1-gcp'
)

# List Pinecone indexes and check if API works
print('Pinecone Indexes: ', pinecone.list_indexes())

# Check requests to OpenAI
# print('OpenAI Engines: ', openai.Engine.list())

# 1. This was done 1 time to get the number of dimensions
# text = ''
# with open(f'contexts/1.txt') as file:
#     text = file.read()   

# res = openai.Embedding.create(
#     input=[
#         text
#     ], engine=MODEL
# )
# embeds = [record['embedding'] for record in res['data']]

# print('res=', res)
# print('embeds=', embeds)

# # check if 'scheppach' index already exists (only create index if not)
# if PINECONE_INDEX_NAME not in pinecone.list_indexes():
#     pinecone.create_index(PINECONE_INDEX_NAME, dimension=len(embeds[0]))

# connect to index
index = pinecone.Index(PINECONE_INDEX_NAME)

# 2. Generate and save embeddings for our 28 txt files
for i in range(1,29):
    with open(f'contexts/{i}.txt') as file:
        text = file.read()
        print(f'\n\nProcessing file {i}.txt')
        tokens = tokenizer.encode(text)
        print('tokens=', len(tokens))
        
        # create embeddings
        res = openai.Embedding.create(input=[text], engine=MODEL)
        embeds = [record['embedding'] for record in res['data']]
        print('Generated embeddings, dimensions: ', len(embeds[0]))
        
        # prep metadata and prepare vector payload
        meta = {'text': text}
        to_upsert = (
            str(i), # vector ID
            embeds, # vector values
            meta) # meta (source text)
        
        # upsert vector to Pinecone
        index.upsert(vectors=[to_upsert])
        print(f'Vector #{i} was upserted OK')