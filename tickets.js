import puppeteer from "puppeteer";
import fetch from "node-fetch";

const TELEGRAM_TOKEN = "8135423857:AAHa_5uFQO_mshsZCj0oQdB4ngc8UThxu-w";
const CHAT_ID = "8436274548";

async function enviarTelegram(texto) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ chat_id: CHAT_ID, text: texto })
    });
}

// Função que coleta tickets pendentes
async function verificarTickets() {
    console.log("Checando tickets pendentes...");

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // LOGIN
    await page.goto("https://ganharseguidor.com/admin/login", { waitUntil: "networkidle2" });

    await page.type('input[name="username"]', "suporte");
    await page.type('input[name="password"]', "123456798@Deus");
    await page.click('button[type="submit"]');

    await page.waitForNavigation();

    // IR PARA TICKETS
    await page.goto("https://ganharseguidor.com/admin/tickets", { waitUntil: "networkidle2" });

    // RASPAR OS TICKETS
    const tickets = await page.evaluate(() => {
        const rows = [...document.querySelectorAll("table tbody tr")];
        return rows.map(r => {
            const cols = r.querySelectorAll("td");
            return {
                id: cols[0]?.innerText.trim(),
                user: cols[1]?.innerText.trim(),
                subject: cols[2]?.innerText.trim(),
                status: cols[3]?.innerText.trim(),
                created: cols[4]?.innerText.trim(),
                updated: cols[5]?.innerText.trim()
            };
        });
    });

    await browser.close();

    const pendentes = tickets.filter(t => t.status.toLowerCase() === "pending");

    if (pendentes.length === 0) {
        console.log("Nenhum ticket pendente.");
        return;
    }

    for (const tk of pendentes) {
        await enviarTelegram(
            `📩 *NOVO TICKET PENDENTE*\n\n` +
            `ID: ${tk.id}\n` +
            `Usuário: ${tk.user}\n` +
            `Assunto: ${tk.subject}\n` +
            `Criado: ${tk.created}\n` +
            `Última atualização: ${tk.updated}`
        );
    }

    console.log("Tickets enviados para o Telegram!");
}

// Executa a cada 10 minutos
setInterval(verificarTickets, 10 * 60 * 1000);

// Executa logo ao iniciar
verificarTickets();
