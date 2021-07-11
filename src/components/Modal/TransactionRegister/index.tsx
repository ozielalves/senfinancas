import { Grid } from "@material-ui/core";
import { FormHandles, SubmitHandler } from "@unform/core";
import { Form } from "@unform/web";
import { useRef } from "react";
import ModalBody, { ModalBodyProps } from "..";
import { useFinances } from "../../../hooks/useFinances";
import { Transaction, TransactionType } from "../../../models/Transaction";
import TextField from "../../Form/TextField";
import { Title } from "../styles";
import { Content, Flag } from "./styles";
import * as Yup from "yup";
import { useSnackbar } from "notistack";
import { transactionCategories } from "../../../services/constants";
import Select from "../../Form/Select";
import Button from "../../Button";

interface TransactionEditModalProps extends Omit<ModalBodyProps, "children"> {
  transactionType: TransactionType;
  onClickSecondaryButton: () => void;
  selectedTransaction?: Transaction;
  resetSelectedTransaction: () => void;
}

interface TransactionErrors {
  [key: string]: string;
}

interface FormData extends Omit<Transaction, "type" | "id"> {}

function TransactionRegisterModal({
  open,
  onClose,
  onClickSecondaryButton,
  transactionType,
  selectedTransaction,
  resetSelectedTransaction,
}: TransactionEditModalProps) {
  const formRef = useRef<FormHandles>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { createTransaction, editTransaction, fetchTransactions } =
    useFinances();

  const handleSubmit: SubmitHandler<FormData> = async (data, { reset }) => {
    try {
      const schema = Yup.object().shape({
        title: Yup.string().required("O título da transação é obrigatório"),
        category: Yup.string().required(
          "A categoria da transação é obrigatório"
        ),
        value: Yup.string().required("O valor da transação é obrigatório"),
      });

      await schema
        .validate(data, { abortEarly: false })
        .then(async () => {
          const { title, category, value } = data as any;
          const transaction: Transaction = {
            title,
            category,
            type: transactionType,
            value: parseFloat(value.replace(",", ".")),
          };
          if (selectedTransaction) {
            await editTransaction({
              ...transaction,
              id: selectedTransaction.id,
            }).then(() => {
              enqueueSnackbar("Transação editada com sucesso", {
                variant: "success",
              });
            });
          } else {
            await createTransaction(transaction).then(() => {
              enqueueSnackbar("Transação cadastrada com sucesso", {
                variant: "success",
              });
            });
          }
        })
        .then(async () => await fetchTransactions().then(() => handleClose()));
      reset();
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errorMessages = {} as TransactionErrors;

        err.inner.forEach((error) => {
          errorMessages[error.path!] = error.message;
          enqueueSnackbar(error.message, {
            variant: "error",
          });
        });

        formRef.current!.setErrors(errorMessages);
      }
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    resetSelectedTransaction();
  };

  const handleSecondaryButtonClick = () => {
    if (selectedTransaction) {
      handleClose();
    } else {
      onClickSecondaryButton();
    }
  };

  const ModalTitle = () => {
    return (
      <Grid container direction="row" spacing={3}>
        <Grid item>
          <Title>
            {selectedTransaction
              ? "Edição de transação"
              : "Cadastro de transação"}
          </Title>
        </Grid>
        <Grid item>
          <Flag type={transactionType}>{transactionType}</Flag>
        </Grid>
      </Grid>
    );
  };

  return (
    <ModalBody open={open} onClose={handleClose} modalTitle={<ModalTitle />}>
      <Form ref={formRef} onSubmit={handleSubmit}>
        <Content
          container
          direction="column"
          justifyContent="center"
          spacing={3}
        >
          <Grid xs item>
            <TextField
              name="title"
              placeholder="Título"
              defaultValue={selectedTransaction?.title}
            />
          </Grid>
          <Grid xs item>
            <Select
              name="category"
              placeholder="Categoria"
              defaultValue={selectedTransaction?.category}
            >
              {transactionCategories.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Grid>
          <Grid xs item>
            <TextField
              name="value"
              placeholder="Valor"
              defaultValue={selectedTransaction?.value}
            />
          </Grid>
        </Content>
        <Grid
          item
          xs={12}
          spacing={1}
          style={{ display: "flex" }}
          alignItems="flex-end"
          justify={"space-between"}
          direction="row"
        >
          <Button
            id="modal-secondary-button"
            width="135px"
            onClick={handleSecondaryButtonClick}
            variant="outlined"
            color="primary"
          >
            {selectedTransaction ? "Cancelar" : "Voltar"}
          </Button>
          <Button
            id="modal-primary-button"
            type="submit"
            width="135px"
            variant="contained"
            style={{ marginLeft: 40 }}
          >
            {selectedTransaction ? "Editar" : "Cadastrar"}
          </Button>
        </Grid>
      </Form>
    </ModalBody>
  );
}

export default TransactionRegisterModal;
