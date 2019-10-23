## Docker

O docker usa containers separados paraa cada serviço. É como uma virtual
machine, porém melhor, pois não precisa de rodar diferentes SOs para diferentes
serviços (imagens). Cada imagem roda numa container, onde vc não se preocupa com
o SO. É um serviço pago. Parece q é o resolvedor de problemas dos programadores.
Ainda não sei até aonde posso usar free. Me parece que o docker não grava nada.
Ou seja, além do servidor do docker, vc precisa tb conectar no servidor
principal. Ainda não sei.

É necessário instalar o docker no pc. Para instalar o docker na máquina, basta
seguir o passo-a-passo do site.

### PostgreSQL do Docker

Instale o container do postgres na sua máquina, porém, instale pelo docker, no
comando abaixo:

`sudo docker run --name <meu-banco> -e POSTGRES_PASSWORD=<meu-password> -p 5432:5432 -d postgres:11`
// sudo docker run --name database -e POSTGRES_PASSWORD=**\*\*\*\*** -p 5432:5432 -d postgres:11

Se vc quiser, pode modificar este comando acima. Na documentação mostra outras
variáveis de ambiente, como o nome de usuário, por exemplo. Se não colocar
usuário, será "postgres"

A primeira porta é a sua. A segunda a do docker. Se vc já tiver usando esta
porta, vc deverá trocá-la.
Ex: 5433:5432

### Conectando / desconectando o docker

Ligar -> `docker start <meu-container>` // docker start database
Desligar -> `docker stop <meu-container>` // docker stop database

### Listar containers

`docker ps`
ou
`docker container ls -a` (melhor)

### Visualizar log do container

`docker logs <meu-container>`

#### Usando interface gráfica do postgres - Postbird

O Postbird é uma ferramenta visual para manipular dados do Postgres.

`sudo snap install postbird`
