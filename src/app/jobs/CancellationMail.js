import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class CancellationMail {
  // O get dá a liberdade de chamarmos o valor do método sem a necessidade de criar um constructor. Ou seja, não precisa disparar o método Cancellation.key(), apenas um Cancellation.key já acessa
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { appointment } = data; // const { appointment, foobar } = data;

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });

    // console.log('Queue executed');
  }
}

export default new CancellationMail();
