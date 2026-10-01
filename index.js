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
const TIMEOUT_CHANNEL_ID = process.env.TIMEOUT_CHANNEL_ID;

const TIMEOUT_MINUTES = 10;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

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
        .setDescription("Envía un anuncio con embed")
        .addStringOption(option =>
            option
                .setName("titulo")
                .setDescription("Título del embed")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("mensaje")
                .setDescription("Contenido del embed")
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
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

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
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Aplica timeout a un usuario")
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
                .setDescription("Razón del timeout")
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Advierte a un usuario")
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario a advertir")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón de la advertencia")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Elimina mensajes")
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Cantidad de mensajes a eliminar")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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
        .setDescription("Muestra todos los comandos disponibles")

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log("✅ Comandos registrados correctamente.");
    } catch (error) {
        console.error(error);
    }
})();

client.once("ready", () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);

    client.user.setActivity("porhub", {
        type: ActivityType.Watching
    });
});

// ==================================================
// SISTEMA AUTOMÁTICO DE TIMEOUT
// ==================================================

client.on("messageCreate", async message => {

    if (message.author.bot) return;

    if (message.channel.id !== TIMEOUT_CHANNEL_ID) return;

    try {

        await message.delete().catch(() => {});

        const miembro = await message.guild.members.fetch(message.author.id);

        if (!miembro.moderatable) {
            console.log(
                `⚠️ No puedo aplicar timeout a ${message.author.tag}`
            );
            return;
        }

        await miembro.timeout(
            TIMEOUT_MINUTES * 60 * 1000,
            "Mensaje enviado en canal restringido"
        );

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Canal restringido")
            .setDescription(
                `**${message.author}**, este canal no permite enviar mensajes.\n\n` +
                `🚫 Tu mensaje fue eliminado.\n` +
                `⏳ Has recibido un **timeout de ${TIMEOUT_MINUTES} minutos**.\n\n` +
                `Por favor, utiliza los canales correspondientes para comunicarte.`
            )
            .setFooter({
                text: "PKL Community • Sistema automático de moderación"
            })
            .setTimestamp();

        const advertencia = await message.channel.send({
            embeds: [embed]
        });

        setTimeout(() => {
            advertencia.delete().catch(() => {});
        }, 10000);

    } catch (error) {
        console.error("❌ Error en el sistema automático de timeout:", error);
    }
});

// ==================================================
// INTERACCIONES
// ==================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    try {

        // =========================
        // /SAY
        // =========================

        if (command === "say") {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const mensaje = interaction.options.getString("mensaje");

            await interaction.channel.send(mensaje);

            return interaction.reply({
                content: "✅ Mensaje enviado.",
                ephemeral: true
            });
        }

        // =========================
        // /EMBED
        // =========================

        if (command === "embed") {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
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

            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const usuario = interaction.options.getUser("usuario");
            const razon =
                interaction.options.getString("razon") || "Sin razón especificada";

            await interaction.guild.members.ban(usuario.id, {
                reason: razon
            });

            return interaction.reply(
                `🔨 **${usuario.tag}** ha sido baneado.\n📝 Razón: ${razon}`
            );
        }

        // =========================
        // /KICK
        // =========================

        if (command === "kick") {

            if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const usuario = interaction.options.getUser("usuario");
            const razon =
                interaction.options.getString("razon") || "Sin razón especificada";

            await interaction.guild.members.kick(usuario.id, razon);

            return interaction.reply(
                `👢 **${usuario.tag}** ha sido expulsado.\n📝 Razón: ${razon}`
            );
        }

        // =========================
        // /TIMEOUT
        // =========================

        if (command === "timeout") {

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const usuario = interaction.options.getUser("usuario");
            const minutos = interaction.options.getInteger("minutos");
            const razon =
                interaction.options.getString("razon") || "Sin razón especificada";

            const miembro = await interaction.guild.members.fetch(usuario.id);

            await miembro.timeout(minutos * 60 * 1000, razon);

            return interaction.reply(
                `⏳ **${usuario.tag}** recibió un timeout de **${minutos} minutos**.\n📝 Razón: ${razon}`
            );
        }

        // =========================
        // /WARN
        // =========================

        if (command === "warn") {

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const usuario = interaction.options.getUser("usuario");
            const razon = interaction.options.getString("razon");

            return interaction.reply(
                `⚠️ **${usuario.tag}** ha recibido una advertencia.\n📝 Razón: ${razon}`
            );
        }

        // =========================
        // /CLEAR
        // =========================

        if (command === "clear") {

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: "❌ No tienes permiso para usar este comando.",
                    ephemeral: true
                });
            }

            const cantidad = interaction.options.getInteger("cantidad");

            await interaction.channel.bulkDelete(cantidad, true);

            return interaction.reply({
                content: `🧹 Se eliminaron **${cantidad} mensajes**.`,
                ephemeral: true
            });
        }

        // =========================
        // /SERVER
        // =========================

        if (command === "server") {

            const guild = interaction.guild;

            const embed = new EmbedBuilder()
                .setTitle(`🌐 ${guild.name}`)
                .addFields(
                    {
                        name: "👥 Miembros",
                        value: `${guild.memberCount}`,
                        inline: true
                    },
                    {
                        name: "🆔 ID",
                        value: guild.id,
                        inline: true
                    },
                    {
                        name: "📅 Creado",
                        value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                        inline: false
                    }
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =========================
        // /USER
        // =========================

        if (command === "user") {

            const usuario =
                interaction.options.getUser("usuario") || interaction.user;

            const embed = new EmbedBuilder()
                .setTitle(`👤 ${usuario.username}`)
                .setThumbnail(usuario.displayAvatarURL({ size: 1024 }))
                .addFields(
                    {
                        name: "🆔 ID",
                        value: usuario.id,
                        inline: true
                    },
                    {
                        name: "📅 Cuenta creada",
                        value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:F>`,
                        inline: false
                    }
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =========================
        // /AVATAR
        // =========================

        if (command === "avatar") {

            const usuario =
                interaction.options.getUser("usuario") || interaction.user;

            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Avatar de ${usuario.username}`)
                .setImage(usuario.displayAvatarURL({
                    extension: "png",
                    size: 1024
                }))
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // =========================
        // /PING
        // =========================

        if (command === "ping") {

            return interaction.reply(
                `🏓 Pong!\nLatencia: **${client.ws.ping}ms**`
            );
        }

        // =========================
        // /HELP
        // =========================

        if (command === "help") {

            const embed = new EmbedBuilder()
                .setTitle("🤖 PKL Community")
                .setDescription(
                    "Aquí tienes los comandos disponibles y sus permisos."
                )
                .addFields(
                    {
                        name: "🌐 Comandos públicos",
                        value:
                            "`/server` — Información del servidor\n" +
                            "`/user` — Información de un usuario\n" +
                            "`/avatar` — Ver avatar de un usuario\n" +
                            "`/ping` — Ver latencia del bot"
                    },
                    {
                        name: "📢 Comandos protegidos • Staff",
                        value:
                            "`/say` — Enviar un anuncio\n" +
                            "`/embed` — Enviar un anuncio con embed"
                    },
                    {
                        name: "🛡️ Comandos protegidos • Moderación",
                        value:
                            "`/ban` — Banear un usuario\n" +
                            "`/kick` — Expulsar un usuario\n" +
                            "`/timeout` — Aplicar timeout\n" +
                            "`/warn` — Advertir un usuario\n" +
                            "`/clear` — Eliminar mensajes"
                    }
                )
                .setFooter({
                    text: "PKL Community • Sistema de comandos"
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

    } catch (error) {

        console.error(error);

        if (interaction.replied || interaction.deferred) {
            return interaction.followUp({
                content: "❌ Ocurrió un error al ejecutar el comando.",
                ephemeral: true
            });
        }

        return interaction.reply({
            content: "❌ Ocurrió un error al ejecutar el comando.",
            ephemeral: true
        });
    }
});

client.login(TOKEN);
