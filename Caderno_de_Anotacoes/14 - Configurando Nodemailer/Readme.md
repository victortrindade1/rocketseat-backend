<!-- TOC -->

- [Configurando Nodemailer](#configurando-nodemailer)
  - [src/config/mail.js](#srcconfigmailjs)
  - [src/lib/Mail.js](#srclibmailjs)
  - [src/app/controllers/AppointmentController.js](#srcappcontrollersappointmentcontrollerjs)

<!-- /TOC -->

# Configurando Nodemailer

No momento que um usuário cancela um agendamento, o sistema dispara um email pro
prestador de serviço. Vamos configurar o Nodemailer \o/

`yarn add nodemailer`

## src/config/mail.js

Existem vários serviços SMTP, servidores que disparam e-mails. O do Gmail não é
recomendado pq ele te bloqueia depois de um tempo. Entre servidores mais usados,
estão:

- Amazon SES (muito bom e é barato)
- Mailgun
- Sparkpost
- Mandril (somente para Mailchimp)
- Gmail (não recomendado pq te bloqueia)

Para desenvolvimento, vc pode usar um gratuito, chamado `Mailtrap`. Este serve
APENAS para desenvolvimento. Não serve para produção.

```javascript
export default {
  host: 'smtp.mailtrap.io',
  port: 2525,
  secure: false,
  auth: {
    user: '87386315217281',
    pass: '4fa5d0a5dedb9e',
  },
  default: {
    from: 'Equipe GoBaraber <noreply@gobarber.com>',
  },
};
```

> Visite: `mailtrap.io`. É um serviço muito fácil para desenvolver disparos de
> e-mail. A versão gratuita tem direito a quase nada, mas dá pra disparar e-mail.
> Vc cria a caixa de e-mail, e vincula a um e-mail fictício. Essa caixa de e-mail
> já mostra todas as configurações q vc precisa.

## src/lib/Mail.js

Existem umas configurações que não chegam a ser configurações as quais nós
precisamos acessar do nosso sistema pra facilmente configurar. São configurações
de certa forma obrigatórias por conta de algumas libs. Estas configurações q não
precisaremos ficar consultando, podemos colocar na pasta `src/lib`.

```javascript
import nodemailer from 'nodemailer';
import mailConfig from '../config/mail';

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null,
    });
  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default new Mail();
```

## src/app/controllers/AppointmentController.js

Quando for mandar e-mail, vai precisar do e-mail do usuário. Eu poderia fazer
um novo findByPk para o User, mas em vez disso, eu aproveito o anterior e passo
User como um include pois existe relacionamento.

```diff
+ import Mail from '../../lib/Mail';

async delete(req, res) {
-    const appointment = await Appointment.findByPk(req.params.id);
+    const appointment = await Appointment.findByPk(req.params.id, {
+      include: [
+        {
+          model: User,
+          as: 'provider',
+          attributes: ['name', 'email'],
+        },
+      ],
+    });
    if (appointment.user_id !== req.userId) {
      ...
    appointment.canceled_at = new Date();

    await appointment.save();

+    await Mail.sendMail({
+      to: `${appointment.provider.name} <${appointment.provider.email}>`,
+      subject: 'Agendamento cancelado',
+      text: 'Você tem um novo cancelamento', // Em vez de text poderia ser um html
+    });

    return res.json(appointment);
  }
}
```
