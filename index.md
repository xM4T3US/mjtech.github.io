<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MJ TECH</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        :root {
            --azul-claro: #4a90e2;
            --cinza-claro: #d1d1d1;
            --preto: #000;
        }
        
        body {
            background: linear-gradient(135deg, #2a2a2a 0%, #0a0a0a 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
            position: relative;
        }
        
        .container {
            width: 100%;
            max-width: 500px;
            text-align: center;
            margin: 0 auto;
            flex: 1;
        }
        
        .profile {
            margin-bottom: 30px;
        }
        
        .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #333;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            margin-bottom: 15px;
        }
        
        .profile h1 {
            font-size: 28px;
            margin-bottom: 10px;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
            color: #fff;
        }
        
        .profile p {
            font-size: 16px;
            opacity: 0.9;
            max-width: 80%;
            margin: 0 auto;
            color: #ccc;
        }
        
        .content {
            background: rgba(40, 40, 40, 0.8);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 1px solid #333;
        }
        
        .content h2 {
            color: #fff;
            margin-bottom: 15px;
        }
        
        .content p {
            color: #ccc;
            line-height: 1.6;
        }
        
        .services {
            background: rgba(40, 40, 40, 0.8);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 1px solid #333;
        }
        
        .services h2 {
            color: #fff;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .services-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .service-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            background: rgba(60, 60, 60, 0.6);
            border-radius: 10px;
            border-left: 4px solid var(--azul-claro);
            transition: all 0.3s ease;
        }
        
        .service-item:hover {
            background: rgba(70, 70, 70, 0.8);
            transform: translateX(5px);
        }
        
        .service-icon {
            width: 24px;
            height: 24px;
            background: var(--azul-claro);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .service-icon i {
            font-size: 12px;
            color: white;
        }
        
        .service-text {
            text-align: left;
            flex: 1;
        }
        
        .service-text h3 {
            color: #fff;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .service-text p {
            color: #ccc;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .contact-btn {
            position: fixed;
            bottom: 30px; /* Posição original */
            right: 30px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 11px 21px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            z-index: 1000;
            opacity: 1;
            transform: translateY(0);
        }
        
        .contact-btn.hidden {
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
        }
        
        .contact-btn:hover {
            background: #3a80d2;
            transform: translateY(-3px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.6);
        }
        
        .contact-btn i {
            font-size: 16px;
        }
        
        .social-menu {
            position: fixed;
            bottom: 90px; /* Ajustado para acompanhar o botão */
            right: 30px;
            display: none;
            flex-direction: column;
            gap: 15px;
            z-index: 999;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .social-item {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            background: rgba(50, 50, 50, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 50px;
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid #444;
            text-decoration: none;
            color: #fff;
            width: fit-content;
            margin-left: auto;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .social-item:hover {
            background: #555;
            transform: translateX(-5px);
        }
        
        .social-item span {
            font-weight: 500;
        }
        
        .social-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
        }
        
        .whatsapp {
            background-color: #25D366;
        }
        
        .instagram {
            background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
        }
        
        .telegram {
            background-color: #0088cc;
        }
        
        .tiktok {
            background-color: #000000;
        }
        
        /* Estilos do rodapé MJ TECH - DIMENSÕES EXATAS */
        footer {
            color: var(--cinza-claro);
            background: var(--preto);
            padding: 3px 10%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 32px;
            margin-top: 30px;
        }

        /* Logotipo */
        .footer-logo {
            position: relative;
            left: -25px;
        }

        .footer-logo img {
            height: 110px;
            border-radius: 10px;
        }

        /* Coluna de contato */
        .footer-column {
            text-align: center;
            line-height: 1.8;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            left: 25px;
        }

        .footer-column h3 {
            color: var(--azul-claro);
            font-size: 0.95rem;
            margin-bottom: 8px;
            border-left: 2px solid var(--azul-claro);
            padding-left: 6px;
        }

        /* Links e ícones */
        .footer-column a {
            color: var(--cinza-claro);
            text-decoration: none;
            font-size: 0.78rem; /* telefone reduzido */
            display: inline-flex;
            align-items: center;
            gap: 5px;
            transition: color 0.3s ease;
        }

        .footer-column a:hover {
            color: var(--azul-claro);
        }

        .icon {
            width: 12px; /* aumentado 3px */
            height: 12px; /* aumentado 3px */
            fill: var(--cinza-claro);
            transition: fill 0.3s ease;
        }

        .footer-column a:hover .icon {
            fill: var(--azul-claro);
        }

        .site-link {
            margin-left: -30px; /* movido 5px mais à esquerda */
            font-size: 1.5rem; /* aumentado +3px */
        }

        .footer-bottom {
            text-align: center;
            background: #0a0a0a;
            padding: 6px;
            font-size: 0.8rem;
            color: var(--cinza-claro);
        }

        .footer-bottom a {
            color: inherit;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-bottom a:hover {
            color: var(--azul-claro);
        }
        
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            z-index: 998;
        }
        
        @media (max-width: 480px) {
            .profile-img {
                width: 100px;
                height: 100px;
            }
            
            .profile h1 {
                font-size: 24px;
            }
            
            .profile p {
                font-size: 14px;
            }
            
            .contact-btn {
                bottom: 20px;
                right: 20px;
                padding: 9px 17px;
                font-size: 13px;
            }
            
            .social-menu {
                bottom: 80px;
                right: 20px;
            }
            
            .contact-btn i {
                font-size: 14px;
            }
            
            .service-item {
                padding: 12px;
            }
            
            .service-text h3 {
                font-size: 15px;
            }
            
            .service-text p {
                font-size: 13px;
            }
            
            /* Ajustes para mobile mantendo as dimensões originais */
            footer {
                padding: 3px 5%;
                min-height: 32px;
            }
            
            .footer-logo {
                left: -15px;
            }
            
            .footer-logo img {
                height: 90px;
            }
            
            .footer-column {
                left: 15px;
            }
            
            .footer-column h3 {
                font-size: 0.85rem;
            }
            
            .footer-column a {
                font-size: 0.7rem;
            }
            
            .site-link {
                font-size: 1.3rem;
                margin-left: -25px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="profile">
            <img src="https://i.pinimg.com/originals/4a/58/ed/4a58ed2f9d6d29b0df10891fb321d423.png" alt="MJ TECH" class="profile-img">
            <h1>MJ TECH</h1>
            <p>Soluções em tecnologia e inovação</p>
        </div>
        
        <div class="content">
            <h2>Bem-vindo à MJ TECH!</h2>
            <p>
                Oferecemos as melhores soluções em tecnologia com qualidade e preço justo. 
                Confira nossos produtos e serviços inovadores!
            </p>
        </div>
        
        <!-- Nova seção de serviços -->
        <div class="services">
            <h2>Serviços Oferecidos</h2>
            <div class="services-list">
                <div class="service-item">
                    <div class="service-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <div class="service-text">
                        <h3>Reparos em Celulares e Tablets</h3>
                        <p>Conserto especializado para dispositivos móveis com peças de qualidade</p>
                    </div>
                </div>
                
                <div class="service-item">
                    <div class="service-icon">
                        <i class="fas fa-laptop"></i>
                    </div>
                    <div class="service-text">
                        <h3>Manutenção em Computadores e Notebooks</h3>
                        <p>Manutenção corretiva e preventiva para garantir o melhor desempenho</p>
                    </div>
                </div>
                
                <div class="service-item">
                    <div class="service-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <div class="service-text">
                        <h3>Desenvolvimento de Software</h3>
                        <p>Criação de softwares, scripts, sites e programas personalizados</p>
                    </div>
                </div>
                
                <div class="service-item">
                    <div class="service-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="service-text">
                        <h3>Instalação de Servidor VPN</h3>
                        <p>Configuração e instalação de servidores VPN para segurança e privacidade</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Rodapé MJ TECH com dimensões exatas -->
    <footer>
        <!-- Logotipo -->
        <div class="footer-logo">
            <img src="https://i.pinimg.com/originals/4a/58/ed/4a58ed2f9d6d29b0df10891fb321d423.png" alt="Logo MJ TECH">
        </div>

        <!-- Contato -->
        <div class="footer-column">
            <h3>Contato</h3>

            <!-- WhatsApp -->
            <a href="https://wa.me/5519998223705" target="_blank">
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                    <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.5 31.5l7.8-2.1C10.7 30.9 13.3 31.5 16 31.5c8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5zM16 29c-2.3 0-4.5-.6-6.5-1.8l-.5-.3-4.6 1.2 1.2-4.5-.3-.5C4.1 21 3.5 18.6 3.5 16 3.5 8.7 9.7 2.5 17 2.5S30.5 8.7 30.5 16 23.3 29 16 29zm7.3-8.8c-.4-.2-2.4-1.2-2.8-1.4-.4-.2-.7-.2-1 .2s-1.2 1.4-1.4 1.6c-.3.2-.5.3-.9.1-2.5-1-4.1-3.5-4.3-3.7-.2-.4 0-.6.1-.8.1-.1.3-.5.5-.7.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8-.1-.2-1-2.4-1.4-3.3-.4-.9-.7-.8-1-.8H10c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.6 1.3 3 1.4 3.2c.2.3 2.5 4 6.1 5.6.9.4 1.6.6 2.2.8.9.3 1.8.2 2.5.2.8 0 2.4-.9 2.7-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.9-.5z"/>
                </svg>
                (19) 99822-3705
            </a>

            <!-- Site -->
            <a href="https://mjtech.net.br" target="_blank" class="site-link">
                mjtech.net.br
            </a>
        </div>
    </footer>

    <div class="footer-bottom">
        © 2025 <a href="https://mjtech.net.br" target="_blank">MJ TECH</a> — Desenvolvido por 
        <a href="https://github.com/xM4T3US" target="_blank">Mateus Junior</a>
    </div>
    
    <!-- Overlay para fechar o menu ao clicar fora -->
    <div class="overlay" id="overlay"></div>
    
    <!-- Menu de redes sociais -->
    <div class="social-menu" id="socialMenu">
        <a href="https://wa.me/5519998223705" class="social-item" target="_blank">
            <span>WhatsApp</span>
            <div class="social-icon whatsapp">
                <i class="fab fa-whatsapp"></i>
            </div>
        </a>
        
        <a href="https://instagram.com/mjtech" class="social-item" target="_blank">
            <span>Instagram</span>
            <div class="social-icon instagram">
                <i class="fab fa-instagram"></i>
            </div>
        </a>
        
        <a href="https://t.me/mjtech" class="social-item" target="_blank">
            <span>Telegram</span>
            <div class="social-icon telegram">
                <i class="fab fa-telegram"></i>
            </div>
        </a>
        
        <a href="https://tiktok.com/@mjtech" class="social-item" target="_blank">
            <span>TikTok</span>
            <div class="social-icon tiktok">
                <i class="fab fa-tiktok"></i>
            </div>
        </a>
    </div>
    
    <!-- Botão Fale Conosco -->
    <button class="contact-btn" id="contactBtn">
        <i class="fas fa-comment-dots"></i>
        Fale Conosco
    </button>

    <script>
        const contactBtn = document.getElementById('contactBtn');
        const socialMenu = document.getElementById('socialMenu');
        const overlay = document.getElementById('overlay');
        let menuOpen = false;
        
        // Abrir/fechar menu ao clicar no botão
        contactBtn.addEventListener('click', () => {
            if (menuOpen) {
                socialMenu.style.display = 'none';
                overlay.style.display = 'none';
            } else {
                socialMenu.style.display = 'flex';
                overlay.style.display = 'block';
            }
            menuOpen = !menuOpen;
        });
        
        // Fechar menu ao clicar no overlay
        overlay.addEventListener('click', () => {
            socialMenu.style.display = 'none';
            overlay.style.display = 'none';
            menuOpen = false;
        });
        
        // Fechar menu ao pressionar a tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOpen) {
                socialMenu.style.display = 'none';
                overlay.style.display = 'none';
                menuOpen = false;
            }
        });

        // Controle de visibilidade do botão durante o scroll
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // Definir a distância do final da página para esconder o botão
            const hideDistance = 200; // pixels do final da página
            
            // Verificar se está próximo do final da página
            if (scrollPosition + windowHeight >= documentHeight - hideDistance) {
                contactBtn.classList.add('hidden');
            } else {
                contactBtn.classList.remove('hidden');
            }
        });
    </script>
</body>
</html>
