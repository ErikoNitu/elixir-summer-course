defmodule School.Logic do
  alias School.Package

  @desc_rules %{
    rule1: "Letters must weigh under 500g.",
    rule2: "International packages require a customs form.",
    rule3: "Fragile packages cannot use standard shipping.",
    rule4: "Parcels over 5000g must use priority shipping.",
    rule5: "Declared value over 100€ requires insurance.",
    rule6: "Fragile packages must have a fragile sticker.",
    rule7: "EU and international packages must use express or priority.",
    rule8: "Letters cannot have insurance.",
    rule9: "Standard shipping is only available for domestic packages under 2000g.",
    rule10: "Fragile international packages over 1000g must use priority."
  }

  def generate_extra_rule(active_rules) do

    new_rule =
      @desc_rules
      |> Enum.filter(fn {rule, _} -> rule not in active_rules end)
      |> Enum.random()

    new_rule
  end

  def generate_package do
    type = Enum.random([:letter, :parcel, :fragile])
    weight = calculate_weight(type)
    destination = Enum.random([:domestic, :eu, :international])
    shipping_class = Enum.random([:standard, :express, :priority])
    declared_value = Enum.random(value_range())
    has_fragile_sticker = Enum.random([true, false])
    has_customs_form = Enum.random([true, false])
    has_insurance = Enum.random([true, false])

    %Package{
      type: type,
      weight: weight,
      destination: destination,
      shipping_class: shipping_class,
      declared_value: declared_value,
      has_fragile_sticker: has_fragile_sticker,
      has_customs_form: has_customs_form,
      has_insurance: has_insurance
    }
  end

  def validate(package, rules_to_apply) do
    [
      rule1: &validate_rule1/1,
      rule2: &validate_rule2/1,
      rule3: &validate_rule3/1,
      rule4: &validate_rule4/1,
      rule5: &validate_rule5/1,
      rule6: &validate_rule6/1,
      rule7: &validate_rule7/1,
      rule8: &validate_rule8/1,
      rule9: &validate_rule9/1,
      rule10: &validate_rule10/1
    ]
    |> Enum.filter(fn {rule, _} -> rule in rules_to_apply end)
    |> Enum.reduce_while({:valid, "success"}, fn {_rule, func}, acc ->
      case func.(package) do
        {:valid, _} -> {:cont, acc}
        {:invalid, msg} -> {:halt, {:invalid, msg}}
      end
    end)
  end

  @type rule ::
          :rule1 | :rule2 | :rule3 | :rule4 | :rule5 | :rule6 | :rule7 | :rule8 | :rule9 | :rule10
  @spec descriptions_by_rules(list(rule())) :: list(String.t())
  def descriptions_by_rules(rules) do
    Enum.reduce(rules, [], fn rule, acc ->
      desc = Map.get(@desc_rules, rule)
      [desc | acc]
    end)
  end

  defp validate_rule1(%{type: :letter, weight: weight}) do
    if weight < 500 do
      {:valid, "rule1"}
    else
      {:invalid, "Letter weights #{weight}g, max 499g"}
    end
  end

  defp validate_rule1(_), do: {:valid, "rule1"}

  defp validate_rule2(%{destination: :international, has_customs_form: true}),
    do: {:valid, "rule2"}

  defp validate_rule2(%{destination: :international, has_customs_form: false}),
    do: {:invalid, "Internation requires customs form"}

  defp validate_rule2(_), do: {:valid, "rule2"}

  defp validate_rule3(%{type: :fragile, shipping_class: :standard}),
    do: {:invalid, "Fragile can't use standard shipping"}

  defp validate_rule3(_), do: {:valid, "rule3"}

  defp validate_rule4(%{type: :parcel, weight: weight, shipping_class: shipping_class})
       when weight > 5000 do
    if shipping_class == :priority do
      {:valid, "rule4"}
    else
      {:invalid, "Parcel over 5000g (#{weight}g) must use priority shipping"}
    end
  end

  defp validate_rule4(_), do: {:valid, "rule4"}

  defp validate_rule5(%{declared_value: declared_value, has_insurance: has_insurance})
       when declared_value > 100 do
    if has_insurance do
      {:valid, "rule5"}
    else
      {:invalid, "insurance required for value over 100$ (#{declared_value})"}
    end
  end

  defp validate_rule5(_), do: {:valid, "rule5"}

  defp validate_rule6(%{type: :fragile, has_fragile_sticker: true}), do: {:valid, "rule6"}

  defp validate_rule6(%{type: :fragile, has_fragile_sticker: false}),
    do: {:invalid, "missing fragile sticker for fragile package"}

  defp validate_rule6(_), do: {:valid, "rule6"}

  defp validate_rule7(%{destination: :eu, shipping_class: shipping_class})
       when shipping_class in [:express, :priority],
       do: {:valid, "rule7"}

  defp validate_rule7(%{destination: :international, shipping_class: shipping_class})
       when shipping_class in [:express, :priority],
       do: {:valid, "rule7"}

  defp validate_rule7(%{destination: destination, shipping_class: shipping_class})
       when destination in [:eu, :international],
       do: {:invalid, "#{destination} has wrong shipping class: #{shipping_class}"}

  defp validate_rule7(_package), do: {:valid, "rule7"}

  defp validate_rule8(%{type: :letter, has_insurance: true}),
    do: {:invalid, "letters can't have insurance"}

  defp validate_rule8(_package), do: {:valid, "rule8"}

  defp validate_rule9(%{shipping_class: :standard, destination: :domestic, weight: weight}) do
    if weight < 2000 do
      {:valid, "rule9"}
    else
      {:invalid, "standard shipping is only available for domestic package under 2000g"}
    end
  end

  defp validate_rule9(%{shipping_class: :standard}),
    do: {:invalid, "standard shipping is only available for domestic package under 2000g"}

  defp validate_rule9(_package), do: {:valid, "rule9"}

  defp validate_rule10(%{
         type: :fragile,
         destination: :international,
         shipping_class: shipping_class,
         weight: weight
       })
       when weight > 1000 do
    if shipping_class == :priority,
      do: {:valid, "rule10"},
      else: {:invalid, "fragile internationle packages over 1000g must use priority"}
  end

  defp validate_rule10(_package) do
    {:valid, "rule10"}
  end

  defp calculate_weight(:letter), do: Enum.random(1..600)
  defp calculate_weight(_), do: Enum.random(1..10000)

  defp value_range do
    10..4000
    |> Range.to_list()
    |> build_value_range([])
    |> Enum.reverse()
  end

  defp build_value_range([], acc), do: acc

  defp build_value_range([hd | tl], acc) do
    to_float = hd / 10
    new_acc = [to_float | acc]

    build_value_range(tl, new_acc)
  end
end
