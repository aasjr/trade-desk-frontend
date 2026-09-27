<img width="341" height="108" alt="image" src="https://github.com/user-attachments/assets/993490db-af1e-402c-a668-4a71f924686d" />

---
O TradeDesk foi desenvolvido para registrar operações de compra e venda na bolsa de valores, acompanhar posições
abertas, consultar cotações e visualizar indicadores consolidados de desempenho.

Ele é o meu MVP da disciplina Arquitetura de Software do curso de Engenharia de Software da PUC-RIO.

Foram criados dois repositórios, um para o backend e outro para o frontend. Você está no repositório do frontend.

## Arquitetura

<img width="753" height="335" alt="image" src="https://github.com/user-attachments/assets/ce2981ce-ffbb-4bf3-90e8-cb27cb1d68e2" />

## Rodando a aplicação localmente

Com o servidor rodando ( ver o repositório https://github.com/aasjr/trade-desk-backend) abrir o arquivo "/src/index.html".

## Como executar através do Docker

Certifique-se de ter o Docker instalado e em execução em sua máquina.

Navegue até o diretório que contém o Dockerfile no terminal e seus arquivos de aplicação e Execute como administrador o seguinte comando para construir a imagem Docker:

```bash
$ docker build -t frontend .
```

Uma vez criada a imagem, para executar o container basta executar, como administrador, seguinte o comando:
``` bash
$ docker run -d -p 8080:80 frontend
```

Uma vez executando, para acessar o front-end, basta abrir o http://localhost:8080/#/ no navegador.





