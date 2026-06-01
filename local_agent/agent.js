const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 9999;

app.use(cors());
app.use(express.json());

app.post('/open-login', async (req, res) => {
    const { platform, proxy, profile_id } = req.body;
    let browser;
    try {
        console.log(`\n[+] Nhận yêu cầu đăng nhập nền tảng: ${platform}`);
        if (proxy) {
            console.log(`[*] Sử dụng Proxy: ${proxy}`);
        } else {
            console.log(`[*] Không dùng Proxy (Sử dụng IP gốc)`);
        }

        const launchArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled' // Chống phát hiện bot
        ];
        
        if (proxy) {
            launchArgs.push(`--proxy-server=${proxy}`);
        }

        const userDataDir = `./user_session_data/${platform}_${profile_id || 'default'}`;
        console.log(`[*] Khởi chạy trình duyệt với Profile: ${userDataDir}`);
        
        browser = await puppeteer.launch({
            headless: false,
            userDataDir: userDataDir,
            defaultViewport: null,
            args: launchArgs
        });

        const pages = await browser.pages();
        const page = pages[0];

        // Nếu proxy có user:pass, ví dụ http://user:pass@ip:port
        // Lưu ý: Puppeteer không hỗ trợ truyền auth trực tiếp qua cờ --proxy-server
        // Chúng ta cần xử lý authentication nếu proxy có định dạng đó
        if (proxy && proxy.includes('@')) {
            const authPart = proxy.split('@')[0];
            const cleanAuth = authPart.replace('http://', '').replace('https://', '');
            const [username, password] = cleanAuth.split(':');
            if (username && password) {
                await page.authenticate({ username, password });
            }
        }

        // Fake user agent để an toàn hơn
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`[*] Đang mở trang đăng nhập ${platform}...`);
        
        let loginUrl = "https://www.tiktok.com/login";
        if (platform.toLowerCase() === 'douyin') {
            loginUrl = "https://www.douyin.com/";
        } else if (platform.toLowerCase() === 'youtube') {
            loginUrl = "https://studio.youtube.com/";
        }

        await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
        
        console.log(`[!] Vui lòng thao tác đăng nhập trên trình duyệt.`);
        console.log(`[!] Hệ thống sẽ tự động đóng trình duyệt khi phát hiện bạn đăng nhập thành công!`);

        let extractedCookies = [];
        let isLoggedIn = false;
        let extractedUsername = "";
        let extractedAccountId = "";
        let extractedAvatarUrl = "";
        
        // Vòng lặp kiểm tra Cookie mỗi 2 giây
        while (!isLoggedIn) {
            try {
                if (!browser.isConnected()) break;
                
                const currentCookies = await page.cookies();
                // TikTok dùng sessionid, Douyin dùng sessionid_ss, Youtube dùng LOGIN_INFO hoặc SID
                const sessionCookie = currentCookies.find(c => 
                    c.name === 'sessionid' || 
                    c.name === 'sessionid_ss' || 
                    c.name === 'SID'
                );
                
                if (sessionCookie) {
                    isLoggedIn = true;
                    console.log(`[+] Đã phát hiện đăng nhập thành công! Đang trích xuất Profile...`);
                    
                    try {
                        if (platform === 'tiktok') {
                            // Chuyển hướng tới trang cá nhân để ép TikTok hiển thị Avatar và Username
                            await page.goto('https://www.tiktok.com/profile', { waitUntil: 'domcontentloaded', timeout: 15000 });
                            
                            // Đợi TikTok redirect từ /profile sang /@username
                            try {
                                await page.waitForFunction('window.location.href.includes("/@")', { timeout: 15000 });
                                console.log("[*] Đã chuyển hướng tới trang cá nhân, đang chờ tải dữ liệu...");
                                
                                // BẮT BUỘC: Đợi thẻ img xuất hiện để chắc chắn DOM đã render xong
                                await page.waitForSelector('img[src*="tiktokcdn"]', { timeout: 10000 });
                                
                                // Chờ thêm 3 giây để các dữ liệu JS nội bộ (SIGI_STATE) kịp khởi tạo
                                await new Promise(r => setTimeout(r, 3000));
                            } catch (e) {
                                console.log("[-] Lỗi khi đợi tải trang profile:", e.message);
                            }
                            
                            const currentUrl = page.url();
                            if (currentUrl.includes('/@')) {
                                extractedUsername = currentUrl.split('/@')[1].split(/[\/\?]/)[0];
                            }
                            
                            extractedAvatarUrl = await page.evaluate((username) => {
                                // 1. Lấy từ Header (Avatar thu nhỏ ở góc phải trên cùng của Navbar luôn là của người dùng đăng nhập)
                                const headerAvt = document.querySelector('span[data-e2e="profile-icon"] img') || 
                                                  document.querySelector('#header-more-menu-icon img');
                                if (headerAvt && headerAvt.src) return headerAvt.src;

                                // 2. Lấy từ Universal Data (Chỉ lấy trong phạm vi webapp.user-detail để đảm bảo chính xác)
                                try {
                                    const ud = window.__UNIVERSAL_DATA_FOR_REHYDRATION__?.['__DEFAULT_SCOPE__']?.['webapp.user-detail'];
                                    if (ud) {
                                        const str = JSON.stringify(ud);
                                        const m = str.match(/"avatarLarger":"([^"]+)"/);
                                        if (m && m[1]) return m[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
                                    }
                                } catch(e) {}
                                
                                // 3. Lấy từ SIGI_STATE (Dữ liệu cũ)
                                try {
                                    const sigi = window.SIGI_STATE?.UserModule?.users;
                                    if (sigi) {
                                        if (sigi[username] && sigi[username].avatarLarger) return sigi[username].avatarLarger;
                                        // Fallback lấy người dùng đầu tiên (thường là chủ profile)
                                        const firstUser = Object.values(sigi)[0];
                                        if (firstUser && firstUser.avatarLarger) return firstUser.avatarLarger;
                                    }
                                } catch (e) {}

                                // 4. DOM dựa vào class/e2e chuẩn
                                const e2eAvt = document.querySelector('[data-e2e="user-avatar"] img') || 
                                               document.querySelector('.tiktok-avatar-img');
                                if (e2eAvt && e2eAvt.src) return e2eAvt.src;

                                // 5. DOM phân tích tổ tiên (Tìm H1 chứa username, rồi tìm ảnh trong container của nó)
                                try {
                                    const h1s = Array.from(document.querySelectorAll('h1'));
                                    const titleH1 = h1s.find(h => h.textContent.includes(username) || h.getAttribute('data-e2e') === 'user-title');
                                    if (titleH1) {
                                        const container = titleH1.parentElement?.parentElement?.parentElement;
                                        if (container) {
                                            const img = container.querySelector('img[src*="tiktokcdn"]');
                                            if (img && img.src) return img.src;
                                        }
                                    }
                                } catch (e) {}
                                
                                // 6. Fallback cuối cùng: Lấy ảnh bất kỳ có URL avatar (loại bỏ getBoundingClientRect vì ảnh có thể chưa load xong dẫn đến width=0)
                                const imgs = Array.from(document.querySelectorAll('img[src*="tiktokcdn"]'));
                                const avtImgs = imgs.filter(i => i.src.includes('-avt-') || i.src.includes('avatar') || i.src.includes('100x100'));
                                if (avtImgs.length > 0) return avtImgs[0].src;
                                
                                return "";
                            }, extractedUsername);
                        } else if (platform === 'douyin') {
                            await page.goto('https://www.douyin.com/user/self', { waitUntil: 'networkidle2', timeout: 15000 });
                            
                            const currentUrl = page.url();
                            if (currentUrl.includes('/user/')) {
                                extractedAccountId = currentUrl.split('/user/')[1].split('?')[0];
                            }
                            
                            extractedAvatarUrl = await page.evaluate(() => {
                                const img = document.querySelector('.personal-info-avatar img') || document.querySelector('img[src*="p3-pc-sign"]');
                                return img ? img.getAttribute('src') : "";
                            });
                        }
                        
                        // Lấy lại Cookie toàn diện sau khi vào Profile
                        extractedCookies = await page.cookies();
                        const uidCookie = extractedCookies.find(c => c.name === 'uid_tt' || c.name === 'uid_ss' || c.name === 'session_id');
                        if (uidCookie) extractedAccountId = uidCookie.value;
                        
                    } catch (e) {
                        console.log("[-] Lỗi khi trích xuất user info:", e.message);
                        extractedCookies = currentCookies; // Fallback
                    }
                    break;
                }
                
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                break;
            }
        }

        if (isLoggedIn) {
            if (browser.isConnected()) await browser.close();
            const cookieString = JSON.stringify(extractedCookies);
            console.log(`[+] Đã trích xuất Cookie và gửi về Web!`);
            res.json({ 
                success: true, 
                cookies: cookieString, 
                proxy: proxy || "",
                username: extractedUsername || "",
                account_id: extractedAccountId || "",
                avatar_url: extractedAvatarUrl || ""
            });
        } else {
            res.status(400).json({ error: "Trình duyệt đã đóng trước khi đăng nhập thành công." });
        }

    } catch (error) {
        console.error(`[-] Lỗi hệ thống:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 LOCAL AGENT ĐANG CHẠY TẠI PORT ${PORT}`);
    console.log(`========================================`);
    console.log(`[!] Vui lòng giữ cửa sổ này chạy ngầm để Web có thể mở trình duyệt.`);
});
