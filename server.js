const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 1800 }); // Cache de 30 minutos

// Middleware
app.use(cors());
app.use(express.json());

// Configurações do Mercado Livre - COM SUAS CREDENCIAIS
const ML_CONFIG = {
    CLIENT_ID: '2796287764814805',
    CLIENT_SECRET: '2Sp7CHFPuSVKOuYOea1Nk6Is2Z6WNl7J',
    SELLER_ID: null, // Vamos descobrir automaticamente
    ACCESS_TOKEN: null,
    TOKEN_EXPIRES: null,
    USER_ID: null
};

// Função para obter access token
async function getAccessToken() {
    try {
        console.log('🔑 Solicitando access token do Mercado Livre...');
        const response = await axios.post('https://api.mercadolivre.com/oauth/token', null, {
            params: {
                grant_type: 'client_credentials',
                client_id: ML_CONFIG.CLIENT_ID,
                client_secret: ML_CONFIG.CLIENT_SECRET
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });
        
        ML_CONFIG.ACCESS_TOKEN = response.data.access_token;
        ML_CONFIG.TOKEN_EXPIRES = Date.now() + (response.data.expires_in * 1000);
        
        console.log('✅ Access token obtido com sucesso!');
        console.log(`⏳ Expira em: ${new Date(ML_CONFIG.TOKEN_EXPIRES).toLocaleTimeString()}`);
        
        return ML_CONFIG.ACCESS_TOKEN;
        
    } catch (error) {
        console.error('❌ Erro ao obter access token:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        throw new Error('Falha na autenticação com Mercado Livre');
    }
}

// Função para descobrir o User ID/Seller ID
async function discoverUserInfo() {
    try {
        console.log('👤 Tentando descobrir informações do usuário...');
        
        let token = ML_CONFIG.ACCESS_TOKEN;
        if (!token) {
            token = await getAccessToken();
        }
        
        // Primeiro, obtemos informações do usuário associado ao token
        const userResponse = await axios.get('https://api.mercadolibre.com/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        ML_CONFIG.USER_ID = userResponse.data.id;
        console.log(`✅ User ID encontrado: ${ML_CONFIG.USER_ID}`);
        
        // Para vendedores, o seller_id geralmente é o mesmo que user_id
        // Mas podemos tentar buscar informações específicas de vendedor
        try {
            const sellerResponse = await axios.get(`https://api.mercadolibre.com/users/${ML_CONFIG.USER_ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Verificar se é vendedor
            if (sellerResponse.data.seller_reputation) {
                ML_CONFIG.SELLER_ID = ML_CONFIG.USER_ID;
                console.log(`✅ Seller ID configurado: ${ML_CONFIG.SELLER_ID}`);
                console.log(`📊 Status do vendedor: ${sellerResponse.data.seller_reputation.power_seller_status || 'Ativo'}`);
            }
            
        } catch (sellerError) {
            console.log('⚠️ Não foi possível obter detalhes do vendedor, usando User ID como Seller ID');
            ML_CONFIG.SELLER_ID = ML_CONFIG.USER_ID;
        }
        
        return {
            user_id: ML_CONFIG.USER_ID,
            seller_id: ML_CONFIG.SELLER_ID,
            nickname: userResponse.data.nickname,
            email: userResponse.data.email
        };
        
    } catch (error) {
        console.error('❌ Erro ao descobrir informações do usuário:', error.message);
        
        // Fallback: pedir ao usuário para informar manualmente
        console.log('💡 Dica: Você pode configurar o SELLER_ID manualmente no arquivo .env');
        
        throw error;
    }
}

// Função para buscar produtos do vendedor
async function fetchProductsFromMercadoLivre() {
    try {
        console.log('🔄 Buscando produtos do Mercado Livre...');
        
        let token = ML_CONFIG.ACCESS_TOKEN;
        
        // Verificar se precisa renovar o token
        if (!token || Date.now() >= ML_CONFIG.TOKEN_EXPIRES) {
            token = await getAccessToken();
        }
        
        // Se não temos Seller ID, tentar descobrir
        if (!ML_CONFIG.SELLER_ID) {
            await discoverUserInfo();
            
            if (!ML_CONFIG.SELLER_ID) {
                throw new Error('Seller ID não configurado. Configure manualmente no arquivo .env');
            }
        }
        
        console.log(`🔍 Buscando produtos do vendedor: ${ML_CONFIG.SELLER_ID}`);
        
        // Buscar anúncios do vendedor com mais parâmetros
        const response = await axios.get(`https://api.mercadolibre.com/sites/MLB/search`, {
            params: {
                seller_id: ML_CONFIG.SELLER_ID,
                limit: 12,
                sort: 'recent', // Mais recentes primeiro
                status: 'active',
                category: 'MLB1648' // Categoria: Computação (opcional, remove para todos)
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        console.log(`✅ ${response.data.results.length} produtos encontrados`);
        
        // Formatar produtos
        const products = response.data.results.map((item, index) => {
            // Melhorar qualidade da imagem
            let imageUrl = item.thumbnail;
            if (imageUrl) {
                imageUrl = imageUrl.replace('I.jpg', 'F.jpg'); // Qualidade melhor
                imageUrl = imageUrl.replace('http://', 'https://'); // Forçar HTTPS
            }
            
            // Se tiver outras imagens, usar a primeira
            if (item.pictures && item.pictures[0] && item.pictures[0].url) {
                imageUrl = item.pictures[0].url;
            }
            
            // Se ainda não tem imagem, usar placeholder
            if (!imageUrl) {
                imageUrl = `https://via.placeholder.com/300x300/2a2a2a/4a90e2?text=${encodeURIComponent(item.title.substring(0, 20))}`;
            }
            
            return {
                id: item.id,
                title: item.title,
                description: truncateDescription(item.title, 120),
                image: imageUrl,
                price: formatPrice(item.price),
                oldPrice: item.original_price ? formatPrice(item.original_price) : null,
                discount: calculateDiscount(item.price, item.original_price),
                link: item.permalink,
                condition: item.condition === 'new' ? 'Novo' : 'Usado',
                available_quantity: item.available_quantity,
                sold_quantity: item.sold_quantity || 0,
                free_shipping: item.shipping?.free_shipping || false,
                accepts_mercadopago: item.accepts_mercadopago || false,
                category: item.category_id ? 'Tecnologia' : 'Produto',
                position: index + 1
            };
        });
        
        // Se não encontrou produtos, usar fallback
        if (products.length === 0) {
            console.log('⚠️ Nenhum produto encontrado, usando fallback');
            return getFallbackProducts();
        }
        
        return products;
        
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error.message);
        
        // Log detalhado para debug
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        
        // Se for erro de autenticação, tentar renovar token
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('🔄 Token expirado ou inválido, tentando renovar...');
            ML_CONFIG.ACCESS_TOKEN = null;
            ML_CONFIG.TOKEN_EXPIRES = null;
            
            // Tentar uma vez mais
            try {
                return await fetchProductsFromMercadoLivre();
            } catch (retryError) {
                console.error('❌ Falha na retentativa:', retryError.message);
            }
        }
        
        // Fallback para produtos de exemplo
        return getFallbackProducts();
    }
}

// Funções auxiliares
function truncateDescription(text, maxLength = 100) {
    if (!text) return 'Descrição não disponível';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function formatPrice(price) {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}

function calculateDiscount(currentPrice, originalPrice) {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return `${Math.round(discount)}% OFF`;
}

// Fallback para quando a API falhar
function getFallbackProducts() {
    console.log('⚠️ Usando produtos de fallback');
    return [
        {
            id: 'fallback-1',
            title: "Mouse Gamer Sem Fio RGB 16000DPI",
            description: "Mouse gamer sem fio com iluminação RGB, 6 botões programáveis e sensor óptico de alta precisão",
            image: "https://http2.mlstatic.com/D_NQ_NP_2X_787972-MLB76058379480_052024-F.webp",
            price: "R$ 89,90",
            oldPrice: "R$ 129,90",
            discount: "31% OFF",
            link: "https://www.mercadolivre.com.br",
            condition: "Novo",
            available_quantity: 15,
            sold_quantity: 42,
            free_shipping: true,
            accepts_mercadopago: true,
            category: "Periféricos"
        },
        {
            id: 'fallback-2',
            title: "Teclado Mecânico Gamer RGB Switch Outemu",
            description: "Teclado mecânico gamer com switches Outemu Blue, iluminação RGB personalizável e construção em ABS",
            image: "https://http2.mlstatic.com/D_NQ_NP_2X_798104-MLB77068584739_072024-F.webp",
            price: "R$ 199,90",
            oldPrice: "R$ 299,90",
            discount: "33% OFF",
            link: "https://www.mercadolivre.com.br",
            condition: "Novo",
            available_quantity: 8,
            sold_quantity: 31,
            free_shipping: true,
            accepts_mercadopago: true,
            category: "Periféricos"
        },
        {
            id: 'fallback-3',
            title: "Headset Gamer 7.1 Surround Sound",
            description: "Headset gamer com som surround virtual 7.1, microfone com cancelamento de ruído e almofadas memory foam",
            image: "https://http2.mlstatic.com/D_NQ_NP_2X_977033-MLB77392111353_082024-F.webp",
            price: "R$ 159,90",
            oldPrice: "R$ 229,90",
            discount: "30% OFF",
            link: "https://www.mercadolivre.com.br",
            condition: "Novo",
            available_quantity: 12,
            sold_quantity: 28,
            free_shipping: false,
            accepts_mercadopago: true,
            category: "Áudio"
        },
        {
            id: 'fallback-4',
            title: "Monitor Gamer 24'' 144Hz 1ms",
            description: "Monitor gamer Full HD 24 polegadas, taxa de atualização 144Hz, tempo de resposta 1ms e painel VA",
            image: "https://http2.mlstatic.com/D_NQ_NP_2X_814845-MLA74159063908_012024-F.webp",
            price: "R$ 899,90",
            oldPrice: "R$ 1.199,90",
            discount: "25% OFF",
            link: "https://www.mercadolivre.com.br",
            condition: "Novo",
            available_quantity: 5,
            sold_quantity: 17,
            free_shipping: true,
            accepts_mercadopago: true,
            category: "Monitores"
        }
    ];
}

// Rota principal - Buscar produtos
app.get('/api/products', async (req, res) => {
    try {
        const cacheKey = 'ml_products_v2';
        let products = cache.get(cacheKey);
        let source = 'cache';
        
        if (!products) {
            console.log('🔄 Cache miss - buscando produtos da API do ML');
            products = await fetchProductsFromMercadoLivre();
            cache.set(cacheKey, products);
            source = 'api';
        } else {
            console.log('⚡ Cache hit - usando produtos em cache');
        }
        
        res.json({
            success: true,
            count: products.length,
            products: products,
            timestamp: new Date().toISOString(),
            source: source,
            seller_id: ML_CONFIG.SELLER_ID,
            cache_info: {
                cached: source === 'cache',
                ttl: cache.getTtl(cacheKey) ? new Date(cache.getTtl(cacheKey)).toISOString() : null
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na rota /api/products:', error.message);
        
        const fallbackProducts = getFallbackProducts();
        
        res.status(200).json({ 
            success: true,
            count: fallbackProducts.length,
            products: fallbackProducts,
            timestamp: new Date().toISOString(),
            source: 'fallback',
            message: 'Usando dados de fallback devido a erro na API',
            error: error.message
        });
    }
});

// Rota de saúde com diagnóstico
app.get('/api/health', async (req, res) => {
    const healthStatus = {
        success: true,
        service: 'MJ TECH Backend API',
        status: 'online',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        diagnostics: {
            ml_config: {
                client_id: ML_CONFIG.CLIENT_ID ? '✅ Configurado' : '❌ Não configurado',
                client_secret: ML_CONFIG.CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado',
                seller_id: ML_CONFIG.SELLER_ID || '❌ Não configurado',
                user_id: ML_CONFIG.USER_ID || '❌ Não descoberto',
                has_token: !!ML_CONFIG.ACCESS_TOKEN,
                token_expires: ML_CONFIG.TOKEN_EXPIRES ? new Date(ML_CONFIG.TOKEN_EXPIRES).toISOString() : null
            },
            cache: {
                stats: cache.getStats(),
                keys: cache.keys()
            },
            system: {
                node_version: process.version,
                platform: process.platform,
                memory: process.memoryUsage()
            }
        },
        endpoints: {
            products: '/api/products',
            health: '/api/health',
            config: '/api/config',
            root: '/'
        }
    };
    
    res.json(healthStatus);
});

// Rota para visualizar configuração
app.get('/api/config', (req, res) => {
    // Mostrar configuração sem expor dados sensíveis
    res.json({
        success: true,
        config: {
            client_id: ML_CONFIG.CLIENT_ID ? '✅ Configurado' : '❌ Não configurado',
            client_secret: ML_CONFIG.CLIENT_SECRET ? '✅ Configurado' : '❌ Não configurado',
            seller_id: ML_CONFIG.SELLER_ID || 'Não configurado',
            user_id: ML_CONFIG.USER_ID || 'Não descoberto',
            token_status: ML_CONFIG.ACCESS_TOKEN ? 'Ativo' : 'Inativo',
            cache_enabled: true,
            cache_ttl: '30 minutos'
        },
        instructions: {
            seller_id: 'Para configurar manualmente, adicione ML_SELLER_ID no arquivo .env',
            test_api: 'Acesse /api/products para testar a conexão com Mercado Livre',
            health_check: 'Acesse /api/health para diagnóstico completo'
        }
    });
});

// Rota para forçar atualização do cache
app.get('/api/refresh', async (req, res) => {
    try {
        console.log('🔄 Forçando atualização do cache...');
        cache.del('ml_products_v2');
        
        const products = await fetchProductsFromMercadoLivre();
        cache.set('ml_products_v2', products);
        
        res.json({
            success: true,
            message: 'Cache atualizado com sucesso',
            count: products.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota raiz com dashboard
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🚀 MJ TECH - Backend API</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #fff;
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 30px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(74, 144, 226, 0.2);
                }
                
                .logo {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    border: 3px solid #4a90e2;
                    padding: 5px;
                }
                
                h1 {
                    color: #4a90e2;
                    font-size: 2.5rem;
                    margin-bottom: 10px;
                    background: linear-gradient(45deg, #4a90e2, #25D366);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                
                .status-badge {
                    display: inline-block;
                    background: #25D366;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: bold;
                    margin-top: 10px;
                }
                
                .dashboard {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }
                
                .card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    padding: 25px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(74, 144, 226, 0.2);
                    border-color: #4a90e2;
                }
                
                .card h3 {
                    color: #4a90e2;
                    margin-bottom: 15px;
                    font-size: 1.3rem;
                }
                
                .endpoint-list {
                    list-style: none;
                }
                
                .endpoint-list li {
                    margin-bottom: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .endpoint-list a {
                    color: #b6e0ff;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: color 0.3s ease;
                }
                
                .endpoint-list a:hover {
                    color: #4a90e2;
                }
                
                .code {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                }
                
                .config-status {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .config-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                }
                
                .success { color: #25D366; }
                .warning { color: #ff9500; }
                .error { color: #ff3b30; }
                
                .btn {
                    display: inline-block;
                    background: linear-gradient(45deg, #4a90e2, #25D366);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                    text-align: center;
                }
                
                .btn:hover {
                    transform: translateY(-2px);
                }
                
                .actions {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }
                
                footer {
                    text-align: center;
                    margin-top: 40px;
                    padding: 20px;
                    color: #8a8a8a;
                    font-size: 0.9rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                @media (max-width: 768px) {
                    .dashboard {
                        grid-template-columns: 1fr;
                    }
                    
                    .actions {
                        flex-direction: column;
                    }
                    
                    .btn {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <div class="logo">
                        <svg width="70" height="70" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="#4a90e2" opacity="0.2"/>
                            <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="#4a90e2" stroke-width="3"/>
                            <path d="M40,40 L60,40 L60,60 L40,60 Z" fill="none" stroke="#25D366" stroke-width="2"/>
                            <text x="50" y="85" text-anchor="middle" fill="#4a90e2" font-size="12" font-weight="bold">MJ TECH</text>
                        </svg>
                    </div>
                    <h1>MJ TECH Backend API</h1>
                    <p>Integração completa com Mercado Livre</p>
                    <div class="status-badge">✅ ONLINE</div>
                </header>
                
                <div class="dashboard">
                    <div class="card">
                        <h3>📡 Endpoints da API</h3>
                        <ul class="endpoint-list">
                            <li>
                                <a href="/api/products" target="_blank">
                                    <span class="code">GET /api/products</span>
                                    <span>📦 Produtos do Mercado Livre</span>
                                </a>
                            </li>
                            <li>
                                <a href="/api/health" target="_blank">
                                    <span class="code">GET /api/health</span>
                                    <span>❤️ Status do Servidor</span>
                                </a>
                            </li>
                            <li>
                                <a href="/api/config" target="_blank">
                                    <span class="code">GET /api/config</span>
                                    <span>⚙️ Configuração</span>
                                </a>
                            </li>
                            <li>
                                <a href="/api/refresh" target="_blank">
                                    <span class="code">GET /api/refresh</span>
                                    <span>🔄 Atualizar Cache</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="card">
                        <h3>🔧 Configuração Atual</h3>
                        <div class="config-status">
                            <div class="config-item">
                                <span>Client ID:</span>
                                <span class="success">✅ Configurado</span>
                            </div>
                            <div class="config-item">
                                <span>Client Secret:</span>
                                <span class="success">✅ Configurado</span>
                            </div>
                            <div class="config-item">
                                <span>Seller ID:</span>
                                <span id="sellerStatus" class="warning">🔄 Detectando...</span>
                            </div>
                            <div class="config-item">
                                <span>Access Token:</span>
                                <span id="tokenStatus" class="warning">🔄 Verificando...</span>
                            </div>
                        </div>
                        
                        <div class="actions">
                            <a href="/api/config" class="btn">Ver Configuração Completa</a>
                            <a href="/api/refresh" class="btn">Atualizar Produtos</a>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>🚀 Integração Frontend</h3>
                        <p>Para usar no seu site, configure no JavaScript:</p>
                        <div class="code" style="padding: 15px; margin: 15px 0; font-size: 0.8rem;">
                            const backendUrl = '${req.protocol}://${req.get('host')}/api/products';
                        </div>
                        <p>Os produtos são atualizados automaticamente do Mercado Livre a cada 30 minutos.</p>
                        
                        <div class="actions">
                            <a href="/api/products" class="btn">Testar API de Produtos</a>
                        </div>
                    </div>
                </div>
                
                <footer>
                    <p>© 2025 MJ TECH - Desenvolvido por Mateus Junior</p>
                    <p style="font-size: 0.8rem; margin-top: 5px;">
                        🔗 GitHub: <a href="https://github.com/xM4T3US" style="color: #4a90e2;" target="_blank">github.com/xM4T3US</a> |
                        📞 WhatsApp: <a href="https://wa.me/5519995189387" style="color: #25D366;" target="_blank">(19) 99518-9387</a>
                    </p>
                </footer>
            </div>
            
            <script>
                // Verificar status em tempo real
                async function checkStatus() {
                    try {
                        const response = await fetch('/api/health');
                        const data = await response.json();
                        
                        // Atualizar Seller ID
                        const sellerId = data.diagnostics?.ml_config?.seller_id;
                        const sellerEl = document.getElementById('sellerStatus');
                        if (sellerId && sellerId !== '❌ Não configurado') {
                            sellerEl.innerHTML = \`✅ \${sellerId.substring(0, 10)}...\`;
                            sellerEl.className = 'success';
                        }
                        
                        // Atualizar Token Status
                        const tokenEl = document.getElementById('tokenStatus');
                        if (data.diagnostics?.ml_config?.has_token) {
                            tokenEl.innerHTML = '✅ Ativo';
                            tokenEl.className = 'success';
                        }
                        
                    } catch (error) {
                        console.error('Erro ao verificar status:', error);
                    }
                }
                
                // Verificar status ao carregar e a cada 30 segundos
                checkStatus();
                setInterval(checkStatus, 30000);
            </script>
        </body>
        </html>
    `);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   🚀  MJ TECH BACKEND INICIADO COM SUCESSO!                 ║
    ║                                                              ║
    ║   🔗  Local:     http://localhost:${PORT}                      ║
    ║   📦  Produtos:  http://localhost:${PORT}/api/products         ║
    ║   ❤️   Saúde:     http://localhost:${PORT}/api/health          ║
    ║   ⚙️   Config:    http://localhost:${PORT}/api/config          ║
    ║                                                              ║
    ║   🔑  Client ID: 2796287764814805                           ║
    ║   🔐  Token:     ${ML_CONFIG.CLIENT_SECRET.substring(0, 10)}...           ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Inicializar conexão com ML
    console.log('🔄 Inicializando conexão com Mercado Livre...');
    
    // Testar conexão após 2 segundos
    setTimeout(async () => {
        try {
            await getAccessToken();
            console.log('✅ Conexão com Mercado Livre estabelecida!');
            
            // Tentar descobrir Seller ID automaticamente
            try {
                await discoverUserInfo();
            } catch (discoverError) {
                console.log('💡 Para melhor funcionamento, configure o SELLER_ID manualmente:');
                console.log('  1. Encontre seu Seller ID no Mercado Livre');
                console.log('  2. Adicione no arquivo .env: ML_SELLER_ID=SEU_ID');
                console.log('  3. Reinicie o servidor');
            }
            
        } catch (error) {
            console.error('❌ Falha na inicialização:', error.message);
            console.log('💡 Verifique suas credenciais no arquivo .env');
        }
    }, 2000);
});
