# RAG-Enhanced Sales Sustainability API

This API implements a Retrieval-Augmented Generation (RAG) system using Langchain, PostgreSQL with pgvector, and OpenAI to provide intelligent responses about Aptar products.

## Architecture

The RAG system consists of several key components:

### 1. Database Layer (`database.service.ts`)
- **PostgreSQL with pgvector**: Stores product data and vector embeddings
- **Connection pooling**: Efficient database connections
- **Auto-initialization**: Creates required tables and extensions

### 2. Embedding Service (`embedding.service.ts`)
- **OpenAI Embeddings**: Uses `text-embedding-3-small` model
- **1536 dimensions**: Optimized for cost and performance
- **Batch processing**: Supports multiple text embeddings

### 3. Vector Store (`vector-store.service.ts`)
- **Product storage**: Stores product metadata and descriptions
- **Vector embeddings**: Converts product data to searchable vectors
- **Similarity search**: Finds relevant products using cosine similarity
- **Content generation**: Creates comprehensive product descriptions for embedding

### 4. RAG Service (`rag.service.ts`)
- **Context retrieval**: Finds relevant products based on user queries
- **Context enhancement**: Adds product information to user prompts
- **Citation generation**: Links responses to source products
- **Fallback handling**: Graceful degradation if RAG fails

## API Endpoints

### Chat Endpoint (`/api/chat`)
**POST** - Main chat interface with RAG enhancement

**Request Body:**
```json
{
  "prompt": "What nasal spray pumps do you have?",
  "history": [
    {"role": "user", "content": "I need a pharmaceutical solution"},
    {"role": "assistant", "content": "I can help you with pharmaceutical solutions..."}
  ]
}
```

**Response:**
```json
{
  "messageId": "msg_1234567890",
  "blocks": [
    {
      "kind": "text",
      "text": "Based on your needs, I recommend our Aptar Pharma Nasal Spray Pump..."
    }
  ],
  "citations": [
    {
      "title": "Aptar Pharma Nasal Spray Pump",
      "score": 0.95
    }
  ],
  "suggestions": [
    "What are the compliance standards for this product?",
    "Can you tell me about the dosing mechanism?",
    "What other pharmaceutical solutions do you offer?"
  ]
}
```

### Initialization Endpoint (`/api/init`)
**POST** - Initialize database and add sample data

**Response:**
```json
{
  "message": "Database initialized successfully with sample data",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Products Management (`/api/products`)
**GET** - Retrieve all products
**POST** - Add a new product

**Add Product Request:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "category": "Category",
  "features": ["Feature 1", "Feature 2"],
  "benefits": ["Benefit 1", "Benefit 2"],
  "applications": ["Application 1", "Application 2"],
  "compliance_standards": ["FDA", "CE"],
  "target_market": "Target Market"
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sales-sustainability
DB_USER=postgres
DB_PASSWORD=postgres
```

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
    description TEXT,
  attributes JSONB,
  solutions JSONB,
    category VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Product Embeddings Table
```sql
CREATE TABLE product_embeddings (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX product_embeddings_embedding_idx
  ON product_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## Setup Instructions

1. **Start the Database:**
   ```bash
   docker-compose up -d
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Environment Variables:**
   Create `.env` file with your OpenAI API key and database credentials.

4. **Initialize the Database:**
   ```bash
   curl -X POST http://localhost:3000/api/init
   ```

5. **Start the Development Server:**
   ```bash
   npm run start:api
   ```

## How RAG Works

1. **User Query**: User asks a question about products
2. **Vector Search**: Query is converted to embedding and compared with product embeddings
3. **Context Retrieval**: Most relevant products are retrieved based on similarity
4. **Context Enhancement**: Retrieved product information is added to the user prompt
5. **LLM Processing**: Enhanced prompt is sent to GPT-4 for response generation
6. **Citation Addition**: Response is enhanced with citations to source products
7. **Structured Response**: Final response is formatted as JSON for frontend consumption

## Sample Products

The system comes pre-loaded with sample Aptar products:

- **Aptar Pharma Nasal Spray Pump** - Pharmaceutical solutions
- **Aptar Beauty Airless Dispenser** - Beauty and home solutions
- **Aptar Food Service Condiment Pump** - Food and beverage solutions
- **Aptar Smart Packaging System** - IoT and smart packaging
- **Aptar Child-Resistant Closure** - Safety and compliance solutions

## Customization

### Adding New Products
Use the `/api/products` endpoint to add new products. The system will automatically:
- Generate embeddings for the product
- Store in the vector database
- Make it searchable for future queries

### Modifying Search Behavior
Adjust the similarity threshold in `rag.service.ts`:
```typescript
const relevantProducts = await VectorStoreService.searchSimilarProducts(
    userPrompt, 
    5, // Number of products to retrieve
    0.6 // Similarity threshold (0.0 to 1.0)
);
```

### Customizing Response Format
Modify the `ChatResponse` interface in `models/chat-response.model.ts` to match your frontend requirements.

## Performance Considerations

- **Embedding Caching**: Embeddings are cached to avoid redundant API calls
- **Connection Pooling**: Database connections are pooled for efficiency
- **Vector Indexing**: pgvector index optimizes similarity searches
- **Fallback Handling**: System gracefully handles failures

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running: `docker-compose up -d`
   - Check environment variables
   - Verify database credentials

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check API quota and billing
   - Ensure model access permissions

3. **Vector Search Not Working**
   - Run initialization: `POST /api/init`
   - Check if products exist in database
   - Verify pgvector extension is installed

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Future Enhancements

- **Multi-language Support**: Embeddings in multiple languages
- **Advanced Filtering**: Category and compliance-based filtering
- **Analytics**: Track query patterns and product popularity
- **Real-time Updates**: WebSocket support for live product updates
- **A/B Testing**: Compare RAG vs non-RAG responses
