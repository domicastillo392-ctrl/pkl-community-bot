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

const TIMEOUT_MINUTES = 1440;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// ==================================================
// COMANDOS
// ==================================================

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
                .setDescription("Razón")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Elimina mensajes")
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
        .setDescription("Muestra todos los comandos disponibles")

].map(command => command.toJSON());

// ==================================================
// REGISTRO DE COMANDOS
// ==================================================

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registrarComandos() {

    try {

        console.log("🔄 Registrando comandos...");
        console.log(`CLIENT_ID: ${CLIENT_ID}`);
        console.log(`GUILD_ID: ${GUILD_ID}`);

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ Comandos registrados correctamente.");
        console.log(`📋 ${commands.length} comandos registrados.`);

    } catch (error) {

        console.error("❌ ERROR REGISTRANDO COMANDOS");
        console.error(error);

    }
}

// ==================================================
// BOT READY
// ==================================================

client.once("ready", () => {

    console.log("=================================");
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    console.log(`🌐 Servidor: ${GUILD_ID}`);
    console.log(`🛡️ Staff Role: ${STAFF_ROLE_ID}`);
    console.log(`🚨 Canal anti-estafa: ${TIMEOUT_CHANNEL_ID}`);
    console.log("=================================");

    client.user.setActivity("PKL ON TOP", {
        type: ActivityType.Watching
    });
});

// ==================================================
// ANTI-ESTAFA
// ==================================================

client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;

    if (message.channel.id !== TIMEOUT_CHANNEL_ID) return;

    try {

        await message.delete().catch(() => {});

        const miembro = await message.guild.members.fetch(
            message.author.id
        );

        if (!miembro.moderatable) {

            console.log(
                `⚠️ No puedo aplicar timeout a ${message.author.tag}`
            );

            return;
        }

        await miembro.timeout(
            TIMEOUT_MINUTES * 60 * 1000,
            "Mensaje enviado en canal restringido - prevención de estafas"
        );

        const embed = new EmbedBuilder()
            .setTitle("🚨 Mensaje bloqueado")
            .setDescription(
                `**${message.author}**, este canal está restringido.\n\n` +
                `🗑️ Tu mensaje fue eliminado.\n` +
                `🔇 Has recibido un **timeout de 24 horas**.\n\n` +
                `⚠️ Este sistema existe para prevenir spam, enlaces maliciosos y posibles estafas.`
            )
            .setFooter({
                text: "PKL Community • Sistema anti-estafa"
            })
            .setTimestamp();

        const aviso = await message.channel.send({
            embeds: [embed]
        });

        setTimeout(() => {
            aviso.delete().catch(() => {});
        }, 10000);

        console.log(
            `🚨 ${message.author.tag} recibió timeout de 24 horas.`
        );

    } catch (error) {

        console.error("❌ Error anti-estafa:", error);

    }
});

// ==================================================
// INTERACCIONES
// ==================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    try {

        // ==============================
        // SAY
        // ==============================

        if (command === "say") {

            if (
                !interaction.member.roles.cache.has(
                    STAFF_ROLE_ID
                )
            ) {

                return interaction.reply({
                    content: "❌ No tienes el rol Staff necesario.",
                    ephemeral: true
                });
            }

            const mensaje =
                interaction.options.getString("mensaje");

            await interaction.channel.send(mensaje);

            return interaction.reply({
                content: "✅ Mensaje enviado.",
                ephemeral: true
            });
        }

        // ==============================
        // EMBED
        // ==============================

        if (command === "embed") {

            if (
                !interaction.member.roles.cache.has(
                    STAFF_ROLE_ID
                )
            ) {

                return interaction.reply({
                    content: "❌ No tienes el rol Staff necesario.",
                    ephemeral: true
                });
            }

            const titulo =
                interaction.options.getString("titulo");

            const mensaje =
                interaction.options.getString("mensaje");

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

        // ==============================
        // BAN
        // ==============================

        if (command === "ban") {

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.BanMembers
                )
            ) {

                return interaction.reply({
                    content: "❌ Necesitas el permiso de Banear miembros.",
                    ephemeral: true
                });
            }

            const usuario =
                interaction.options.getUser("usuario");

            const razon =
                interaction.options.getString("razon") ||
                "Sin razón especificada";

            const miembro =
                await interaction.guild.members.fetch(
                    usuario.id
                ).catch(() => null);

            if (miembro && !miembro.bannable) {

                return interaction.reply({
                    content:
                        "❌ No puedo banear a ese usuario. Su rol puede estar por encima del mío.",
                    ephemeral: true
                });
            }

            await interaction.guild.members.ban(
                usuario.id,
                {
                    reason: razon
                }
            );

            return interaction.reply(
                `🔨 **${usuario.tag}** ha sido baneado.\n📝 Razón: ${razon}`
            );
        }

        // ==============================
        // KICK
        // ==============================

        if (command === "kick") {

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.KickMembers
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Necesitas el permiso de Expulsar miembros.",
                    ephemeral: true
                });
            }

            const usuario =
                interaction.options.getUser("usuario");

            const razon =
                interaction.options.getString("razon") ||
                "Sin razón especificada";

            const miembro =
                await interaction.guild.members.fetch(
                    usuario.id
                ).catch(() => null);

            if (!miembro) {

                return interaction.reply({
                    content:
                        "❌ Ese usuario no está en el servidor.",
                    ephemeral: true
                });
            }

            if (!miembro.kickable) {

                return interaction.reply({
                    content:
                        "❌ No puedo expulsar a ese usuario. Su rol puede estar por encima del mío.",
                    ephemeral: true
                });
            }

            await miembro.kick(razon);

            return interaction.reply(
                `👢 **${usuario.tag}** ha sido expulsado.\n📝 Razón: ${razon}`
            );
        }

        // ==============================
        // TIMEOUT
        // ==============================

        if (command === "timeout") {

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.ModerateMembers
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Necesitas el permiso de Moderar miembros.",
                    ephemeral: true
                });
            }

            const usuario =
                interaction.options.getUser("usuario");

            const minutos =
                interaction.options.getInteger("minutos");

            const razon =
                interaction.options.getString("razon") ||
                "Sin razón especificada";

            const miembro =
                await interaction.guild.members.fetch(
                    usuario.id
                );

            if (!miembro.moderatable) {

                return interaction.reply({
                    content:
                        "❌ No puedo aplicar timeout a ese usuario. El rol del bot debe estar por encima del suyo.",
                    ephemeral: true
                });
            }

            await miembro.timeout(
                minutos * 60 * 1000,
                razon
            );

            return interaction.reply(
                `⏳ **${usuario.tag}** recibió un timeout de **${minutos} minutos**.\n📝 Razón: ${razon}`
            );
        }

        // ==============================
        // WARN
        // ==============================

        if (command === "warn") {

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.ModerateMembers
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Necesitas el permiso de Moderar miembros.",
                    ephemeral: true
                });
            }

            const usuario =
                interaction.options.getUser("usuario");

            const razon =
                interaction.options.getString("razon");

            return interaction.reply(
                `⚠️ **${usuario.tag}** ha recibido una advertencia.\n📝 Razón: ${razon}`
            );
        }

        // ==============================
        // CLEAR
        // ==============================

        if (command === "clear") {

            if (
                !interaction.member.permissions.has(
                    PermissionFlagsBits.ManageMessages
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Necesitas el permiso de Gestionar mensajes.",
                    ephemeral: true
                });
            }

            const cantidad =
                interaction.options.getInteger("cantidad");

            const eliminados =
                await interaction.channel.bulkDelete(
                    cantidad,
                    true
                );

            return interaction.reply({
                content:
                    `🧹 Se eliminaron **${eliminados.size} mensajes**.`,
                ephemeral: true
            });
        }

        // ==============================
        // SERVER
        // ==============================

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
                        value:
                            `<t:${Math.floor(
                                guild.createdTimestamp / 1000
                            )}:F>`,
                        inline: false
                    }
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // ==============================
        // USER
        // ==============================

        if (command === "user") {

            const usuario =
                interaction.options.getUser("usuario") ||
                interaction.user;

            const embed = new EmbedBuilder()
                .setTitle(`👤 ${usuario.username}`)
                .setThumbnail(
                    usuario.displayAvatarURL({
                        size: 1024
                    })
                )
                .addFields(
                    {
                        name: "🆔 ID",
                        value: usuario.id,
                        inline: true
                    },
                    {
                        name: "📅 Cuenta creada",
                        value:
                            `<t:${Math.floor(
                                usuario.createdTimestamp / 1000
                            )}:F>`,
                        inline: false
                    }
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // ==============================
        // AVATAR
        // ==============================

        if (command === "avatar") {

            const usuario =
                interaction.options.getUser("usuario") ||
                interaction.user;

            const embed = new EmbedBuilder()
                .setTitle(
                    `🖼️ Avatar de ${usuario.username}`
                )
                .setImage(
                    usuario.displayAvatarURL({
                        extension: "png",
                        size: 1024
                    })
                )
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });
        }

        // ==============================
        // PING
        // ==============================

        if (command === "ping") {

            return interaction.reply(
                `🏓 Pong!\nLatencia: **${client.ws.ping}ms**`
            );
        }

        // ==============================
        // HELP
        // ==============================

        if (command === "help") {

            const embed = new EmbedBuilder()
                .setTitle("🤖 PKL Community")
                .setDescription(
                    "Comandos disponibles:"
                )
                .addFields(
                    {
                        name: "🌐 Públicos",
                        value:
                            "`/server`\n" +
                            "`/user`\n" +
                            "`/avatar`\n" +
                            "`/ping`"
                    },
                    {
                        name: "📢 Staff",
                        value:
                            "`/say`\n" +
                            "`/embed`"
                    },
                    {
                        name: "🛡️ Moderación",
                        value:
                            "`/ban`\n" +
                            "`/kick`\n" +
                            "`/timeout`\n" +
                            "`/warn`\n" +
                            "`/clear`"
                    }
                )
                .setFooter({
                    text: "PKL Community"
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

    } catch (error) {

        console.error(
            `❌ Error ejecutando /${command}:`,
            error
        );

        if (
            interaction.replied ||
            interaction.deferred
        ) {

            return interaction.followUp({
                content:
                    "❌ Ocurrió un error al ejecutar el comando.",
                ephemeral: true
            });

        }

        return interaction.reply({
            content:
                "❌ Ocurrió un error al ejecutar el comando.",
            ephemeral: true
        });
    }
});

// ==================================================
// INICIO
// ==================================================

(async () => {

    await registrarComandos();

    client.login(TOKEN);

})();
