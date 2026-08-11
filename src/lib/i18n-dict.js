// i18n-dict.js — dicionário de traduções. A chave é a string em português
// exatamente como aparece no código; o valor é a tradução.
//
// Para adicionar suporte a uma nova tela, basta envolver os textos dela com
// `t("...")` no componente e acrescentar as entradas correspondentes aqui.
// Textos sem entrada caem de volta pro português automaticamente.

export const EN = {
  // ─── Navegação (TabBar / Sidebar) ───
  "Início": "Home",
  "Transações": "Transactions",
  "Análise": "Analysis",
  "Perfil": "Profile",
  "Orçamentos": "Budgets",
  "Caixinhas": "Savings",
  "Recorrentes": "Recurring",
  "Histórico": "History",
  "Nova Transação": "New Transaction",
  "Nova transação": "New transaction",

  // ─── Tela de Perfil ───
  "Refazer tour": "Redo tour",
  "Baixar dados (.xlsx)": "Download data (.xlsx)",
  "Baixar relatório (.pdf)": "Download report (.pdf)",
  "Sair da conta": "Sign out",
  "Excluir conta permanentemente": "Delete account permanently",
  "Não foi possível gerar o arquivo.": "Couldn't generate the file.",
  // ConfirmModal — sair
  "Sair da conta?": "Sign out?",
  "Você precisará entrar novamente com seu e-mail e senha. Os dados continuam salvos na nuvem.":
    "You'll need to sign in again with your email and password. Your data stays saved in the cloud.",
  "Sair": "Sign out",
  // ConfirmModal — desfazer parceria
  "Desfazer conta compartilhada?": "Undo shared account?",
  "Vocês deixarão de ver os gastos um do outro. As caixinhas ficarão com você ({nome} perde acesso).":
    "You'll stop seeing each other's expenses. The savings stay with you ({nome} loses access).",
  "seu parceiro": "your partner",
  "Desfazendo…": "Undoing…",
  "Desfazer": "Undo",

  // ─── Idioma / Moeda / Aparência ───
  "Idioma": "Language",
  "Moeda": "Currency",
  "Muda apenas o símbolo e o formato — sem conversão de câmbio.":
    "Only changes the symbol and format — no currency conversion.",
  "Real": "Brazilian Real",
  "US Dollar": "US Dollar",
  "Euro": "Euro",
  "British Pound": "British Pound",
  "Aparência": "Appearance",
  "Tema": "Theme",
  "Sistema": "System",
  "Claro": "Light",
  "Escuro": "Dark",
  "Cor de destaque": "Accent color",

  // ─── Desempenho / Modo leve ───
  "Desempenho": "Performance",
  "Modo leve": "Lite mode",
  "Deixa o app mais ágil em celulares menos potentes, abrindo mão de efeitos visuais.":
    "Makes the app snappier on less powerful phones, giving up visual effects.",
  "Automático": "Automatic",
  "Ligado": "On",
  "Desligado": "Off",
  "Ligado: este aparelho foi detectado como mais modesto.":
    "On: this device was detected as a modest one.",
  "Desligado: este aparelho dá conta dos efeitos completos.":
    "Off: this device handles the full effects.",
  "Menos efeitos, mais fluidez. Sem vidro, sem animações de transição e sem deslizar entre meses no card de saldo.":
    "Fewer effects, more fluidity. No glass, no transition animations, and no swiping between months on the balance card.",
  "Todos os efeitos ligados.": "All effects on.",

  // ─── Cabeçalho do perfil ───
  "Você": "You",
  "Remover foto": "Remove photo",
  "Alterar foto de perfil": "Change profile photo",
  "Seu nome": "Your name",
  "Não foi possível usar essa imagem.": "Couldn't use this image.",

  // ─── Conta compartilhada ───
  "Conta compartilhada": "Shared account",
  "Conectado com {nome}": "Connected with {nome}",
  "Vocês visualizam os gastos um do outro. Caixinhas são compartilhadas.":
    "You can see each other's expenses. Savings are shared.",
  "Desfazer parceria": "Undo partnership",
  "Convite enviado para {nome}": "Invitation sent to {nome}",
  "Aguardando aceite. Você pode cancelar enquanto não houver resposta.":
    "Waiting for acceptance. You can cancel while there's no response.",
  "Cancelar convite": "Cancel invitation",
  "Convide seu parceiro pra que vocês vejam os gastos um do outro e dividam caixinhas.":
    "Invite your partner so you can see each other's expenses and share savings.",
  "Convidar parceiro": "Invite partner",

  // ─── Modal: convidar parceiro ───
  "Vocês veem os gastos um do outro (sem editar).":
    "You see each other's expenses (no editing).",
  "Caixinhas viram compartilhadas — ambos editam.":
    "Savings become shared — both can edit.",
  "Dá pra desfazer; quem desfaz leva as caixinhas.":
    "You can undo it; whoever undoes keeps the savings.",
  "Pensada pra ": "Designed for ",
  "dois usuários": "two users",
  " (ex: casal) acompanharem os gastos um do outro e juntarem dinheiro pra metas comuns.":
    " (e.g. a couple) to track each other's expenses and pool money for shared goals.",
  "Só entre ": "Only between ",
  "2 pessoas": "2 people",
  ". Pra trocar, desfaça a parceria atual antes.":
    ". To switch, undo the current partnership first.",
  "Cancelar": "Cancel",
  "Continuar": "Continue",
  "Entenda como funciona antes de convidar.":
    "Understand how it works before inviting.",
  "Ele(a) precisa já ter conta no app.":
    "They must already have an account in the app.",
  "Convite enviado!": "Invitation sent!",
  "Aguarde a resposta nas notificações.":
    "Wait for the reply in notifications.",
  "E-mail do parceiro": "Partner's email",
  "Não foi possível enviar o convite.": "Couldn't send the invitation.",
  "Enviando…": "Sending…",
  "Enviar convite": "Send invitation",

  // ─── Modal: excluir conta ───
  "Excluir sua conta?": "Delete your account?",
  "Essa ação é ": "This action is ",
  "irreversível": "irreversible",
  ". Todos os seus dados (gastos, caixinhas, orçamentos, recorrentes) serão apagados permanentemente da nuvem.":
    ". All your data (expenses, savings, budgets, recurring) will be permanently deleted from the cloud.",
  "Você está em uma conta compartilhada — seu parceiro receberá uma notificação avisando que você saiu, e as caixinhas dele serão limpas.":
    "You're in a shared account — your partner will get a notification that you left, and their savings will be cleared.",
  "Não foi possível excluir a conta.": "Couldn't delete the account.",
  "Excluir": "Delete",
  "Por segurança, digite sua senha pra confirmar a exclusão.":
    "For security, enter your password to confirm deletion.",
  "Senha": "Password",
  "Sua senha": "Your password",
  "Digite sua senha.": "Enter your password.",
  "Senha incorreta.": "Incorrect password.",
  "Confirmar exclusão": "Confirm deletion",
  "Apagando seus dados": "Deleting your data",
  "Apagando seus dados…": "Deleting your data…",

  // ─── Modal: baixar dados ───
  "Baixar dados": "Download data",
  "Arquivo .xlsx para abrir no Excel ou Google Sheets":
    "An .xlsx file to open in Excel or Google Sheets",
  "Período": "Period",
  "Todos os dados": "All data",
  "Transações, caixinhas, recorrentes e orçamentos":
    "Transactions, savings, recurring and budgets",
  "Apenas transações deste mês": "Only this month's transactions",
  "Gerando…": "Generating…",
  "Baixar": "Download",

  // ─── Modal + documento: relatório em PDF ───
  "Baixar relatório": "Download report",
  "Relatório em PDF com as transações do mês":
    "A PDF report with the month's transactions",
  "Mês do relatório": "Report month",
  "Relatório deste mês": "Report for this month",
  "O relatório é sempre de um mês só.": "The report always covers a single month.",
  "Você ainda não tem nenhum mês com transações lançadas.":
    "You don't have any month with transactions logged yet.",
  "Relatório mensal": "Monthly report",
  "Gerado em {data}": "Generated on {data}",
  "Resumo do mês": "Month summary",
  "Orçamento do mês": "Month budget",
  "Gastos": "Expenses",
  "Também na conta do restante": "Also counted in what's left",
  "Guardado em caixinhas": "Saved in jars",
  "Total lançado no mês": "Total logged this month",
  "Transações ({n})": "Transactions ({n})",
  "Nenhuma transação neste mês.": "No transactions this month.",
  "Gastos por categoria": "Spending by category",
  "Gerado pelo MyCounts": "Generated by MyCounts",
  "Página {n} de {total}": "Page {n} of {total}",
  "Pagamento": "Payment",

  // ─── Login / Cadastro ───
  "Criar conta": "Create account",
  "Recuperar senha": "Reset password",
  "Entrar": "Sign in",
  "Crie sua conta para começar a organizar suas finanças.":
    "Create your account to start organizing your finances.",
  "Digite seu e-mail e enviaremos um link para redefinir a senha.":
    "Enter your email and we'll send you a link to reset your password.",
  "Bem-vindo de volta. Acesse sua conta.":
    "Welcome back. Sign in to your account.",
  "Nome": "Name",
  "Como quer ser chamado(a)?": "What should we call you?",
  "E-mail": "Email",
  "Mín. 8 caracteres, letras e números": "Min. 8 characters, letters and numbers",
  "Você receberá um e-mail de confirmação. A conta só é ativada depois que você clicar no link.":
    "You'll receive a confirmation email. The account is only activated after you click the link.",
  "Aguarde…": "Please wait…",
  "Muitas tentativas. Aguarde {tempo}.": "Too many attempts. Wait {tempo}.",
  "Aguarde {tempo}": "Wait {tempo}",
  "Enviar link": "Send link",
  "Esqueci minha senha": "Forgot my password",
  "Já tem conta? ": "Already have an account? ",
  "Voltar para o login": "Back to sign in",
  "Não tem conta? ": "Don't have an account? ",
  "Cadastre-se": "Sign up",
  // validação / erros de login
  "Digite um e-mail válido.": "Enter a valid email.",
  "Digite seu nome.": "Enter your name.",
  "Digite a senha.": "Enter your password.",
  "A senha precisa ter ao menos 8 caracteres, com letras e números.":
    "The password must be at least 8 characters, with letters and numbers.",
  "E-mail inválido.": "Invalid email.",
  "E-mail ou senha incorretos.": "Incorrect email or password.",
  "Já existe uma conta com esse e-mail.": "An account with this email already exists.",
  "Senha muito fraca (mínimo 8 caracteres).": "Password too weak (minimum 8 characters).",
  "Muitas tentativas. Tente novamente em alguns minutos.":
    "Too many attempts. Try again in a few minutes.",
  "Sem conexão. Verifique sua internet.": "No connection. Check your internet.",
  "Sem conexão": "No connection",
  "Sem conexão · somente leitura": "No connection · read-only",
  "Não é possível adicionar ou editar transações offline.":
    "You can't add or edit transactions offline.",
  "Algo deu errado. Tente novamente.": "Something went wrong. Try again.",
  "Enviamos um link para redefinir sua senha. Confira seu e-mail.":
    "We sent a link to reset your password. Check your email.",
  "Esconder senha": "Hide password",
  "Mostrar senha": "Show password",

  // ─── Verificação de e-mail ───
  "Confirme seu e-mail": "Confirm your email",
  "Enviamos um link de confirmação para": "We sent a confirmation link to",
  "Clique nele para ativar sua conta e depois volte aqui.":
    "Click it to activate your account, then come back here.",
  "Verificando…": "Verifying…",
  "Já confirmei, entrar": "I confirmed, sign in",
  "Reenviando…": "Resending…",
  "Reenviar e-mail": "Resend email",
  "Usar outra conta": "Use another account",
  "Ainda não detectamos a confirmação. Abra o link do e-mail e tente de novo.":
    "We haven't detected the confirmation yet. Open the email link and try again.",
  "Não foi possível verificar agora. Tente novamente.":
    "Couldn't verify right now. Try again.",
  "E-mail de confirmação reenviado. Confira sua caixa de entrada (e o spam).":
    "Confirmation email resent. Check your inbox (and spam).",
  "Você pediu muitos e-mails. Aguarde alguns minutos.":
    "You requested too many emails. Wait a few minutes.",
  "Não foi possível reenviar agora.": "Couldn't resend right now.",

  // ─── Dashboard (Início) ───
  "Bom dia": "Good morning",
  "Boa tarde": "Good afternoon",
  "Boa noite": "Good evening",
  "Bem-vindo ✦": "Welcome ✦",
  "Notificações": "Notifications",
  "Abrir perfil": "Open profile",
  "Simular um gasto": "Simulate an expense",
  // CardSaldo
  "Gasto em {mes}": "Spent in {mes}",
  "vs. mês anterior": "vs. last month",
  "Orçamento": "Budget",
  "entradas": "income",
  "guardado em caixinhas": "saved in jars",
  "Restante": "Remaining",
  "Acima do orçamento": "Over budget",
  "Parceiro": "Partner",
  "gasto": "spent",
  "Resta ": "Left ",
  "Acima ": "Over ",
  "Disponível juntos": "Available together",
  // ProximasVencer
  "Próximas a vencer": "Coming due",
  "Ver tudo →": "See all →",
  "Hoje": "Today",
  "Amanhã": "Tomorrow",
  "Em {n} dias": "In {n} days",
  "Parcela {atual}/{total}": "Installment {atual}/{total}",
  "Mensal": "Monthly",
  // UltimosGastos
  "Últimos gastos": "Recent expenses",
  "Ver todos →": "See all →",
  "Sem gastos neste mês.": "No expenses this month.",
  // CaixinhasPreview
  "Ver todas →": "See all →",
  // ContaProximaModal
  "Vence hoje": "Due today",
  "Vence amanhã": "Due tomorrow",
  "Vence em {n} dias": "Due in {n} days",
  "Valor": "Amount",
  "Prazo": "Due",
  "Fechar": "Close",
  "Marcar como pago": "Mark as paid",
  // InsightsCard
  "Insights do mês": "Monthly insights",
  "Insight {n}": "Insight {n}",

  // ─── Compartilhados (data.js / common.jsx) ───
  // Meses
  "Janeiro": "January", "Fevereiro": "February", "Março": "March",
  "Abril": "April", "Maio": "May", "Junho": "June", "Julho": "July",
  "Agosto": "August", "Setembro": "September", "Outubro": "October",
  "Novembro": "November", "Dezembro": "December",
  "Jan": "Jan", "Fev": "Feb", "Abr": "Apr", "Mai": "May", "Jun": "Jun",
  "Jul": "Jul", "Ago": "Aug", "Set": "Sep", "Out": "Oct", "Dez": "Dec",
  // Categorias padrão
  "Alimentação": "Food",
  "Transporte": "Transport",
  "Moradia": "Housing",
  "Lazer": "Leisure",
  "Saúde": "Health",
  "Compras": "Shopping",
  "Educação": "Education",
  "Assinaturas": "Subscriptions",
  "Financiamento": "Financing",
  "Outros": "Other",
  // Pagamentos
  "Cartão de crédito": "Credit card",
  "Cartão de débito": "Debit card",
  "Dinheiro": "Cash",
  // Paletas de cor
  "Violeta": "Violet",
  "Esmeralda": "Emerald",
  "Oceano": "Ocean",
  "Mostarda": "Mustard",
  "Rosa": "Pink",
  "Preto": "Black",
  // TopBar / SeletorMes / ItemTransacao
  "Voltar": "Back",
  "Mês anterior": "Previous month",
  "Próximo mês": "Next month",
  "Entrada": "Income",
  "Entradas": "Income",
  "Resgatado": "Withdrawn",
  "Guardado": "Saved",
  "na caixinha": "in savings",
  "parte na caixinha": "partly in savings",
  "Já está numa caixinha — não está disponível pra gastar": "Already in a savings jar — not available to spend",
  "Diferença de {mes}": "{mes} difference",
  "Em {mes} você fechou com sobra. Quer trazer esse valor pro mês atual?": "You ended {mes} with money left over. Bring it into the current month?",
  "Em {mes} você gastou mais que o orçamento. Quer trazer essa diferença como dívida do mês atual?": "You overspent your budget in {mes}. Bring that difference in as a debt for the current month?",
  "Sobrou": "Left over",
  "Faltou": "Over budget",
  "Trazer": "Bring it in",
  "Agora não": "Not now",
  "Use um valor fixo que você recebe todo mês, como salário ou mesada. Recebimentos extras devem ser lançados como Entrada em Transações.": "Use a fixed amount you receive every month, like a salary or allowance. Extra income should be logged as Income under Transactions.",
  "Do(a) {nome}": "{nome}'s",
  "Do parceiro": "Partner's",
  "Cobrança recorrente todo mês": "Recurring charge every month",

  // ─── Transações (Gastos) ───
  "{n} transações ·": "{n} transactions ·",
  "Total:": "Total:",
  "{x} já em caixinhas": "{x} already in savings jars",
  "Buscar gasto...": "Search expense...",
  "Todas": "All",
  "Todos": "All",
  "crédito": "Credit",
  "débito": "Debit",
  "Nenhum gasto": "No expenses",
  "Nenhuma entrada": "No income",
  "Tente outro filtro ou adicione um novo.": "Try another filter or add a new one.",
  "Editar": "Edit",
  "Excluir parcelamento?": "Delete installment plan?",
  "Excluir este gasto?": "Delete this expense?",
  "Excluir esta entrada?": "Delete this income?",
  "Os {valor} guardados em {caixinhas} saem da caixinha junto — tudo volta a como estava antes desta entrada.": "The {valor} saved in {caixinhas} comes back out too — everything returns to how it was before this income.",
  "Esta entrada banca {valor} guardados em {caixinhas}. Ao salvar, esse valor sai da caixinha.": "This income backs {valor} saved in {caixinhas}. On save, that amount comes back out of the jar.",
  "\"{desc}\" foi parcelado em {n}×. Todas as parcelas serão removidas.":
    "\"{desc}\" was split into {n}×. All installments will be removed.",
  "\"{desc}\" ({valor}) será removido permanentemente.":
    "\"{desc}\" ({valor}) will be permanently removed.",

  // ─── Modal Adicionar / Editar transação ───
  "Editar transação": "Edit transaction",
  "Nova transação": "New transaction",
  "Salvar": "Save",
  "Saída": "Expense",
  "Categoria": "Category",
  "Nova": "New",
  "Nome da categoria": "Category name",
  "Cor {cor}": "Color {cor}",
  "Criar categoria": "Create category",
  "Descrição (ex: Mercado, Uber...)": "Description (e.g. Groceries, Uber...)",
  "Data": "Date",
  "Repetir todo mês": "Repeat every month",
  "Útil para assinaturas, aluguel e mensalidades.":
    "Useful for subscriptions, rent and monthly bills.",
  "Reajuste por parcela": "Adjustment per installment",
  "Porcentagem de reajuste por parcela": "Adjustment percentage per installment",
  "1ª parcela {v1} · 2ª {v2} · 3ª {v3}": "1st installment {v1} · 2nd {v2} · 3rd {v3}",
  "Vence todo dia": "Due every day",
  "Até": "Until",
  "Duplo-clique para excluir": "Double-click to delete",
  "Segure 2s para excluir": "Hold 2s to delete",
  "Excluir \"{nome}\"?": "Delete \"{nome}\"?",
  "A categoria será removida e as transações antigas que a usavam passam a aparecer em \"Outros\". O orçamento associado, se houver, também é apagado.":
    "The category will be removed and old transactions that used it will appear under \"Other\". The associated budget, if any, is also deleted.",
  "Você excedeu o orçamento de {cat}: {proj} de {lim}.":
    "You exceeded the {cat} budget: {proj} of {lim}.",
  "Atenção: {pct}% do orçamento de {cat} ({proj} de {lim}).":
    "Heads up: {pct}% of the {cat} budget ({proj} of {lim}).",
  "Você excedeu o limite do cartão de crédito: {proj} de {lim}.":
    "You exceeded the credit card limit: {proj} of {lim}.",
  "Atenção: {pct}% do limite do cartão de crédito ({proj} de {lim}).":
    "Heads up: {pct}% of the credit card limit ({proj} of {lim}).",

  // ─── Orçamentos ───
  "Orçamento mensal": "Monthly budget",
  "Definir orçamento": "Set budget",
  "Gasto: {x}": "Spent: {x}",
  "{pct}% utilizado": "{pct}% used",
  "Por forma de pagamento": "By payment method",
  "Sem limite definido": "No limit set",
  "Por categoria": "By category",
  "{gasto} de {orc}": "{gasto} of {orc}",

  // ─── Ciclo da fatura do cartão ───
  "Fechamento da fatura": "Statement closing",
  "Fecha dia {dia} · vence no mês seguinte": "Closes on the {dia}th · due the following month",
  "Fecha no último dia do mês · vence no mês seguinte":
    "Closes on the last day of the month · due the following month",
  "Dia de fechamento da fatura": "Statement closing day",
  "Último": "Last",
  "Fatura do cartão": "Card statement",
  "Ajustar →": "Adjust →",
  "Fatura de {mes}": "{mes} statement",
  "Fechada · vence em {mes}": "Closed · due in {mes}",
  "Aberta · fecha {data} · vence em {mes}": "Open · closes {data} · due in {mes}",
  "Não entra no saldo do mês: cada compra já abateu o mês em que foi feita.":
    "Not counted in the month's balance: each purchase already reduced the month it was made in.",
  "Entra na fatura de {fatura} · você paga em {vence}":
    "Goes on the {fatura} statement · you pay in {vence}",

  // ─── Recorrentes ───
  "Esses gastos são adicionados automaticamente todo mês. Edite para atualizar do mês atual em diante ou cancele se a cobrança parar.":
    "These expenses are added automatically every month. Edit to update from the current month onward, or cancel if the charge stops.",
  "Nenhum gasto recorrente": "No recurring expenses",
  "Ao adicionar um gasto, marque \"Repetir todo mês\" para ele aparecer aqui e ser lançado automaticamente nos próximos meses.":
    "When adding an expense, check \"Repeat every month\" for it to appear here and be added automatically in the coming months.",
  "{cat} · todo dia {dia} · desde {inicio}": "{cat} · every day {dia} · since {inicio}",
  " · até {fim}": " · until {fim}",
  " · reajuste {pct}% por parcela": " · {pct}% adjustment per installment",
  "Cancelar \"{desc}\"?": "Cancel \"{desc}\"?",
  "Os lançamentos de meses passados continuam no histórico. Os do mês atual em diante serão removidos.":
    "Entries from past months stay in history. Those from the current month onward will be removed.",
  "Cancelar recorrência": "Cancel recurrence",
  "Editar recorrente": "Edit recurring",
  "As mudanças valem do mês atual em diante.": "Changes apply from the current month onward.",
  "Descrição": "Description",

  // ─── Histórico ───
  "Meses": "Months",
  "{count} transações": "{count} transactions",

  // ─── Detalhe da categoria ───
  "Gasto neste mês": "Spent this month",
  "Orçamento {x}": "Budget {x}",
  "Você passou {x} do limite": "You went {x} over the limit",
  "Nenhum gasto nesta categoria neste mês.": "No expenses in this category this month.",

  // ─── Prompt de instalação (PWA) ───
  "Instale o MyCounts": "Install MyCounts",
  "O app instalado abre mais rápido, funciona offline e tem desempenho melhor que o navegador. Você ganha um ícone na tela inicial e uma experiência sem barras de endereço.":
    "The installed app opens faster, works offline and performs better than the browser. You get a home-screen icon and an experience with no address bars.",
  "Abre instantaneamente, como um app nativo.": "Opens instantly, like a native app.",
  "Funciona mesmo com internet instável.": "Works even with unstable internet.",
  "Ícone na tela inicial, sem barras do navegador.": "Home-screen icon, no browser bars.",
  "Instalar app": "Install app",
  "Continuar no navegador": "Continue in browser",
  "Como instalar no iPhone": "How to install on iPhone",
  "No Safari, toque no botão de Compartilhar e depois em \"Adicionar à Tela de Início\".":
    "In Safari, tap the Share button and then \"Add to Home Screen\".",
  "1. Toque no ícone de Compartilhar na barra inferior do Safari.":
    "1. Tap the Share icon in Safari's bottom bar.",
  "2. Role e selecione \"Adicionar à Tela de Início\".":
    "2. Scroll and select \"Add to Home Screen\".",
  "3. Confirme em \"Adicionar\" no canto superior direito.":
    "3. Confirm with \"Add\" in the top-right corner.",
  "Entendi": "Got it",

  // ─── Caixinhas (savings) ───
  "Sem caixinhas ainda": "No savings yet",
  "Crie uma caixinha para juntar dinheiro com um objetivo (viagem, reserva, presente…). A meta é opcional.":
    "Create a savings jar to set money aside for a goal (trip, emergency fund, gift…). The target is optional.",
  "Nova caixinha": "New savings",
  "Já tinha dinheiro guardado?": "Already had money saved?",
  "Informar o valor que já havia": "Enter the amount already there",
  "Começar do zero": "Start from zero",
  "Esse valor já existia — entra na caixinha sem sair do seu saldo do mês.":
    "This money already existed — it goes into the savings without leaving your monthly balance.",
  "Guardado: {x}": "Saved: {x}",
  "Rendimento: +{x}": "Earnings: +{x}",
  "Guarde {x} por mês": "Save {x} per month",
  "Guarde {x} por semana": "Save {x} per week",
  "Guarde {x} por dia": "Save {x} per day",
  // CardLembranca
  "Meta alcançada! 🎉": "Goal reached! 🎉",
  "Você juntou tudo. Hora de aproveitar.": "You saved it all. Time to enjoy.",
  "Prazo vencido": "Deadline passed",
  "Ainda faltam {x}. Reajuste a data ou a meta.": "You're still {x} short. Adjust the date or goal.",
  "Faltam {x}": "{x} to go",
  "Sem prazo definido. Edite a caixinha para receber uma sugestão de quanto guardar por mês.":
    "No deadline set. Edit the savings to get a suggestion of how much to save per month.",
  "Para chegar em {data} ({n} dia restante).": "To reach it by {data} ({n} day left).",
  "Para chegar em {data} ({n} dias restantes).": "To reach it by {data} ({n} days left).",
  // CaixinhaScreen
  "Caixinha": "Savings",
  "Caixinha não encontrada.": "Savings not found.",
  "Adicionar": "Add",
  "Resgatar": "Withdraw",
  "Excluir caixinha": "Delete savings",
  "Essa caixinha será removida permanentemente.": "This savings jar will be permanently removed.",
  "Os {n} depósito guardado ({x}) serão perdidos.": "The {n} saved deposit ({x}) will be lost.",
  "Os {n} depósitos guardados ({x}) serão perdidos.": "The {n} saved deposits ({x}) will be lost.",
  // CabecalhoCaixinha
  "Você já juntou": "You've saved",
  "Já rendeu": "Earned so far",
  "{x} desde sempre": "{x} all time",
  "Inclui o rendimento que já saiu em resgates": "Includes earnings already taken out in withdrawals",
  "{x}% do CDI": "{x}% of CDI",
  "Principal {x}": "Principal {x}",
  "Meta {x}": "Target {x}",
  // HistoricoDepositos
  "Nenhum depósito ainda": "No deposits yet",
  "{n} depósito": "{n} deposit",
  "{n} depósitos": "{n} deposits",
  "Do orçamento": "From the budget",
  "Saldo inicial": "Opening balance",
  "Resgatado para entradas": "Withdrawn to income",
  " · levou {x} de rendimento": " · took {x} of earnings",
  "Da entrada: {desc}": "From income: {desc}",
  "removida": "removed",
  "Por {nome}": "By {nome}",
  "Pelo parceiro": "By partner",
  // ModalCaixinha
  "Editar caixinha": "Edit savings",
  "Nome": "Name",
  "Ex: Viagem para a praia": "e.g. Beach trip",
  "Cor": "Color",
  "Meta (opcional)": "Target (optional)",
  "Definir um valor-alvo": "Set a target amount",
  "Sem meta — só vou juntando": "No target — just saving",
  "Até quando?": "By when?",
  "(opcional)": "(optional)",
  "Avançado": "Advanced",
  "Investimento": "Investment",
  "Render como investimento": "Earn like an investment",
  "Sem rendimento — caixinha comum": "No earnings — regular savings",
  "Taxa de rendimento (% do CDI)": "Yield rate (% of CDI)",
  "Selic atual: ": "Current Selic: ",
  "a.a.": "p.a.",
  " · rende ~": " · yields ~",
  "100% CDI = renda igual ao CDI · Estimativa diária com base na Meta Selic do BCB. Não considera IR.":
    "100% CDI = earns the same as the CDI · Daily estimate based on the BCB's Selic target. Excludes income tax.",
  // ModalDeposito
  "Adicionar valor": "Add money",
  "Valor do depósito": "Deposit amount",
  "Quando": "When",
  "Origem do valor": "Source of the money",
  "Será debitado do orçamento do mês.": "It will be debited from the month's budget.",
  "{n} lançamentos": "{n} entries",
  "disponível {x}": "available {x}",
  " · alocado {x}": " · allocated {x}",
  "Valor excede o disponível desta entrada.": "Amount exceeds what's available from this income.",
  // ModalResgate
  "Resgatar de \"{nome}\"": "Withdraw from \"{nome}\"",
  "Valor a resgatar": "Amount to withdraw",
  "Disponível na caixinha": "Available in savings",
  "Tudo": "All",
  "Valor maior que o disponível na caixinha.": "Amount is greater than what's available in savings.",
  "O valor volta como uma ": "The money comes back as an ",
  "entrada do mês atual": "income for the current month",
  " e fica disponível no orçamento.": " and becomes available in the budget.",
  "O rendimento de {x} sai junto e deixa de render.": "The {x} in earnings comes out with it and stops compounding.",

  // ─── Análise ───
  "Nenhum gasto registrado neste mês.": "No expenses recorded this month.",
  "Total gasto": "Total spent",
  "Média por dia": "Daily average",
  "Sobrou": "Left over",
  "{pct}% vs mês anterior": "{pct}% vs last month",
  "{n} dia": "{n} day",
  "{n} dias": "{n} days",
  "{n} categoria": "{n} category",
  "{n} categorias": "{n} categories",
  "sem orçamento definido": "no budget set",
  "{pct}% do orçamento": "{pct}% of the budget",
  "acima do orçamento": "over budget",
  "Evolução (6 meses)": "Trend (6 months)",
  "Média mensal: {x}": "Monthly average: {x}",
  "Você vs. {nome}": "You vs. {nome}",
  "parceiro": "partner",
  "Você: {x}": "You: {x}",
  "{nome}: {x}": "{nome}: {x}",
  "Você": "You",
  "Top categorias": "Top categories",
  "Maiores gastos do mês": "Biggest expenses of the month",
  "Acompanhar orçamentos": "Track budgets",
  "Veja onde está perto do limite": "See where you're close to the limit",

  // ─── Onboarding (tour) ───
  "Suas finanças,\nfinalmente claras": "Your finances,\nfinally clear",
  "Tenha controle completo em poucos minutos por mês.":
    "Get full control in just a few minutes a month.",
  "Lance gastos\ne entradas": "Log expenses\nand income",
  "Categorize ou marque como recorrente — tudo em segundos.":
    "Categorize or mark as recurring — all in seconds.",
  "Veja para onde\nseu dinheiro vai": "See where\nyour money goes",
  "Gráficos, evolução mensal e comparações automáticas.":
    "Charts, monthly trends and automatic comparisons.",
  "Planeje e guarde\npara suas metas": "Plan and save\nfor your goals",
  "Defina orçamentos e crie caixinhas pra alcançar seus objetivos.":
    "Set budgets and create savings jars to reach your goals.",
  "Tudo pronto.\nVamos começar?": "All set.\nShall we start?",
  "Você pode rever este tour em Perfil → Refazer tour.":
    "You can replay this tour in Profile → Redo tour.",
  "Pular": "Skip",
  "Começar": "Start",
  "Ir para slide {n}": "Go to slide {n}",
  "Meta": "Goal",

  // ─── Notificações ───
  "Eventos recentes da parceria": "Recent partnership events",
  "Convites de conta compartilhada": "Shared account invitations",
  "Aceite para visualizar os gastos um do outro": "Accept to see each other's expenses",
  "Tudo em dia": "All caught up",
  "Sem contas a vencer nos próximos dias.": "No bills due in the coming days.",
  "Notificações bloqueadas": "Notifications blocked",
  "Receba lembretes no celular": "Get reminders on your phone",
  "Habilite nas configurações do navegador/sistema para receber lembretes.":
    "Enable it in your browser/system settings to receive reminders.",
  "Avisamos quando uma conta estiver perto de vencer, mesmo com o app fechado.":
    "We'll let you know when a bill is about to be due, even with the app closed.",
  "Ativar": "Enable",
  // ConviteItem
  "{nome} te convidou": "{nome} invited you",
  "Alguém": "Someone",
  "Recusando…": "Declining…",
  "Recusar": "Decline",
  "Aceitando…": "Accepting…",
  "Aceitar": "Accept",
  "Não foi possível aceitar.": "Couldn't accept.",
  "Não foi possível recusar.": "Couldn't decline.",
  // NotifParceriaItem
  " aceitou seu convite!": " accepted your invitation!",
  "Conta compartilhada ativada.": "Shared account activated.",
  " criou uma caixinha": " created a savings jar",
  " depositou {x}": " deposited {x}",
  " retirou {x}": " withdrew {x}",
  "Na caixinha \"{nome}\"": "In savings \"{nome}\"",
  " desfez a conta compartilhada": " undid the shared account",
  "Dom": "Sun", "Seg": "Mon", "Ter": "Tue", "Qua": "Wed",
  "Qui": "Thu", "Sex": "Fri", "Sáb": "Sat",
  // SecaoProximas / Terminando / Orçamento / Recorrências
  "Cobranças nos próximos 7 dias": "Charges in the next 7 days",
  "Parcelamentos terminando": "Installments ending",
  "Em breve liberam espaço no seu orçamento": "They'll soon free up room in your budget",
  "Última parcela {prazo} · {n}× {x}": "Last installment {prazo} · {n}× {x}",
  "Orçamento por categoria": "Budget by category",
  "Alertas das categorias com orçamento definido": "Alerts for categories with a set budget",
  "Ajustar →": "Adjust →",
  "{cat} estourou o orçamento": "{cat} went over budget",
  "{cat} chegando ao limite": "{cat} nearing the limit",
  "Recorrências para revisar": "Recurring to review",
  "Cobranças não geradas para o próximo mês. Cancele ou continue.":
    "Charges not generated for next month. Cancel or keep them.",
  "Gerenciar →": "Manage →",
  "{cat} · última cobrança em {ultimo}": "{cat} · last charge in {ultimo}",
  // Notificações nativas (lib/notifications.js)
  "Parcelamento terminando": "Installment ending",
  " — última parcela próxima ({atual}/{total})": " — last installment coming up ({atual}/{total})",
  "{gasto} de {orc} ({pct}%).": "{gasto} of {orc} ({pct}%).",
  "Você já usou {pct}% do orçamento ({gasto} de {orc}).":
    "You've already used {pct}% of the budget ({gasto} of {orc}).",

  // ─── Insights do mês (lib/insights.jsx) ───
  "No mês passado você gastou mais em ": "Last month you spent the most on ",
  " — {x} ({pct}% do total).": " — {x} ({pct}% of the total).",
  "Você está gastando ": "You're spending ",
  "{diff}% a mais": "{diff}% more",
  "{diff}% a menos": "{diff}% less",
  " que no mês passado.": " than last month.",
  "Sua maior alta foi em ": "Your biggest increase was in ",
  " (+{pct}%).": " (+{pct}%).",
  "Você economizou ": "You saved ",
  " em ": " on ",
  " vs. o mês passado.": " vs. last month.",
  "Você passou ": "You went ",
  " do orçamento deste mês.": " over this month's budget.",
  "Seu maior gasto foi ": "Your biggest expense was ",
  " — {x} ({pct}% do mês).": " — {x} ({pct}% of the month).",
  " está com ": " is at ",
  " da meta — faltam {x}.": " of the goal — {x} to go.",
  "Você já guardou ": "You've saved ",
  " em {n} caixinha.": " in {n} savings jar.",
  " em {n} caixinhas.": " in {n} savings jars.",
  "Suas entradas cobrem os gastos com ": "Your income covers your spending with ",
  "{pct}% de folga": "{pct}% to spare",
  " ({x} sobrando).": " ({x} left over).",
  "Os gastos superaram as entradas em ": "Spending exceeded income by ",
  "{n} conta vence": "{n} bill is due",
  "{n} contas vencem": "{n} bills are due",
  " nos próximos 7 dias — {x} no total.": " in the next 7 days — {x} total.",
  " passou do orçamento em ": " went over budget by ",
  " já consumiu ": " has already used ",
  " do orçamento da categoria.": " of the category's budget.",
  "{n} transações no mês — ticket médio de ":
    "{n} transactions this month — average ticket of ",
  "Comece adicionando seus gastos do mês — os insights aparecem quando houver dados suficientes pra analisar.":
    "Start by adding this month's expenses — insights appear once there's enough data to analyze.",

  // ─── Modal Simular gasto ───
  "Cabe no orçamento?": "Does it fit the budget?",
  "Simule um gasto e veja como ele afeta seu mês.":
    "Simulate an expense and see how it affects your month.",
  "Valor da compra": "Purchase amount",
  "Parcelas": "Installments",
  "à vista": "one-time",
  "{n}× de {vp}": "{n}× of {vp}",
  "Diminuir parcelas": "Decrease installments",
  "Aumentar parcelas": "Increase installments",
  "Quantidade de parcelas": "Number of installments",
  "Digite um valor para ver a análise.": "Enter an amount to see the analysis.",
  "Restante deste mês": "Left this month",
  // blocos de análise (segmentos; trechos em <strong> são chaves próprias)
  "Seu orçamento deste mês já está ": "Your budget this month is already ",
  "negativo em {x}": "{x} in the red",
  ". Esse gasto aumentaria o déficit em ": ". This expense would increase the deficit by ",
  "Cabe no orçamento.": "Fits the budget.",
  " Compromete {pct}% do mês e ainda sobrariam ": " It takes {pct}% of the month and you'd still have ",
  " até o fim do mês.": " left until the end of the month.",
  "Estoura o orçamento em {x}.": "Exceeds the budget by {x}.",
  " Você só tem {restante} disponíveis no mês — o restante teria que sair de outra fonte.":
    " You only have {restante} available this month — the rest would have to come from another source.",
  " — de {ini} até {fim}. Total final: {total}.":
    " — from {ini} to {fim}. Final total: {total}.",
  "Este mês já está com orçamento ": "This month's budget is already ",
  "negativo": "negative",
  " — a 1ª parcela aumentaria o déficit em ": " — the 1st installment would increase the deficit by ",
  "A 1ª parcela ": "The 1st installment ",
  "cabe neste mês": "fits this month",
  " — restarão {sobra} depois dela.": " — {sobra} will be left after it.",
  "A parcela de {vp} já ": "The {vp} installment already ",
  "estoura o restante deste mês": "exceeds what's left this month",
  " em {estouro}.": " by {estouro}.",
  "Cada parcela toma ": "Each installment takes ",
  "{pct}% do seu orçamento mensal": "{pct}% of your monthly budget",
  " — comprometimento alto por ": " — high commitment for ",
  "{n} meses": "{n} months",
  "Cada parcela representa ": "Each installment represents ",
  " do seu orçamento mensal — comprometimento médio por {n} meses.":
    " of your monthly budget — medium commitment for {n} months.",
  "Cada parcela representa apenas ": "Each installment represents just ",
  " do seu orçamento mensal — impacto leve durante {n} meses.":
    " of your monthly budget — light impact for {n} months.",
};
