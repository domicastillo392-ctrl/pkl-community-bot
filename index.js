```js
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActivityType
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// =========================
// COMANDOS
// =========================

const commands = [

    new SlashCommandBuilder()
        .setName("say")
        .setDescription("Envía un mensaje como el bot")
        .addStringOption(option =>
            option
                .setName("mensaje")
                .setDescription("Mensaje que quieres enviar")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Envía un anuncio en formato embed")
        .addStringOption(option =>
            option
                .setName("titulo")
                .setDescription("Título del anuncio")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("mensaje")
                .setDescription("Contenido del anuncio")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Banea a un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario a banear")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón del baneo")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulsa a un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario a expulsar")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón de la expulsión")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Silencia temporalmente a un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("minutos")
                .setDescription("Duración en minutos")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Advierte a un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón de la advertencia")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Elimina mensajes del canal")
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Cantidad de mensajes")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    new SlashCommandBuilder()
        .setName("server")
        .setDescription("Muestra información del servidor"),

    new SlashCommandBuilder()
        .setName("user")
        .setDescription("Muestra información de un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Muestra el avatar de un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario")
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Muestra la latencia del bot"),

    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Muestra los comandos disponibles")

].map(command => command.toJSON());

// =========================
// REGISTRAR COMANDOS
// =========================

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log("🔄 Registrando comandos...");

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("✅ Comandos registrados correctamente.");
    } catch (error) {
        console.error("❌ Error registrando comandos:", error);
    }
}

// =========================
// BOT LISTO
// =========================

client.once("ready", async () => {

    console.log(`🤖 Bot conectado como ${client.user.tag}`);

    client.user.setActivity("porhub", {
        type: ActivityType.Watching
    });

    console.log("👀 Actividad configurada: Viendo porhub");

    await registerCommands();
});

// =========================
// INTERACCIONES
// =========================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    // =========================
    // /SAY
    // =========================

    if (command === "say") {

        if (
            !STAFF_ROLE_ID ||
            !interaction.member.roles.cache.has(STAFF_ROLE_ID)
        ) {
            return interaction.reply({
                content: "❌ No tienes permiso para utilizar este comando.",
                ephemeral: true
            });
        }

        const mensaje = interaction.options.getString("mensaje");

        await interaction.channel.send(mensaje);

        return interaction.reply({
            content: "✅ Anuncio enviado.",
            ephemeral: true
        });
    }

    // =========================
    // /EMBED
    // =========================

    if (command === "embed") {

        if (
            !STAFF_ROLE_ID ||
            !interaction.member.roles.cache.has(STAFF_ROLE_ID)
        ) {
            return interaction.reply({
                content: "❌ No tienes permiso para utilizar este comando.",
                ephemeral: true
            });
        }

        const titulo = interaction.options.getString("titulo");
        const mensaje = interaction.options.getString("mensaje");

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(mensaje)
            .setTimestamp();

        await interaction.channel.send({
            embeds: [embed]
        });

        return interaction.reply({
            content: "✅ Embed enviado.",
            ephemeral: true
        });
    }

    // =========================
    // /BAN
    // =========================

    if (command === "ban") {

        if (!interaction.member.permissions.has(PermissionFlag
```
